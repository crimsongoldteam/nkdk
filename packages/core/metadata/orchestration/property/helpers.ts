import { capitalize } from "~/helpers/capitalize"
import { ConfigurationContext } from "~/metadata/context/types"
import { ToMetadata } from ".."
import { TypeRulesOperations } from "./fn"
import { MetadataItemRule, PropertyRule } from "./types"

type Path = string[]

const pathKey = (path: Path): string => JSON.stringify(path)

interface PathInfo {
  keys: string[]
  xmlKeyToKey: Record<string, string>
  orderByRule: { key: string; order: number | undefined; xmlKey: string }[]
}

interface PathStructure {
  pathOrder: Path[]
  pathToInfo: Map<string, PathInfo>
  childContainersByPath: Map<string, Set<string>>
}

const buildPathStructure = <Rule extends MetadataItemRule>(
  rule: Rule,
  tagFilter: string[] | undefined
): PathStructure => {
  const pathOrder: Path[] = []
  const pathOrderSet = new Set<string>()
  const pathToInfo = new Map<string, PathInfo>()

  const propertyEntries = Object.entries(rule.properties).filter(([_key, ruleProp]) => {
    return tagFilter === undefined || (ruleProp.tag !== undefined && tagFilter.includes(ruleProp.tag))
  })

  for (const [key, ruleProp] of propertyEntries) {
    const path: Path = ruleProp.xmlParents ?? []
    const pk = pathKey(path)
    if (!pathOrderSet.has(pk)) {
      pathOrderSet.add(pk)
      pathOrder.push(path)
    }
    const info = pathToInfo.get(pk)
    const xmlKey = ruleProp.xml ?? capitalize(key)
    const entry = { key, xmlKey, order: ruleProp.order }
    if (!info) {
      pathToInfo.set(pk, {
        keys: [key],
        xmlKeyToKey: { [xmlKey]: key },
        orderByRule: [entry],
      })
    } else {
      info.keys.push(key)
      info.xmlKeyToKey[xmlKey] = key
      info.orderByRule.push(entry)
    }
  }

  for (const info of pathToInfo.values()) {
    info.orderByRule.sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined) return a.order - b.order
      if (a.order !== undefined) return -1
      if (b.order !== undefined) return 1
      return a.xmlKey.localeCompare(b.xmlKey)
    })
  }

  const childContainersByPath = new Map<string, Set<string>>()
  for (const path of pathOrder) {
    const set = new Set<string>()
    for (const other of pathOrder) {
      if (other.length === path.length + 1 && other.slice(0, path.length).every((s, i) => s === path[i])) {
        set.add(other[path.length]!)
      }
    }
    childContainersByPath.set(pathKey(path), set)
  }

  return { pathOrder, pathToInfo, childContainersByPath }
}

export const getOrderedKeysToXML = <Rule extends MetadataItemRule>(params: {
  rule: Rule
  referenceMetadata: ToMetadata<Rule["itemType"]> | undefined
  tag?: string[]
}): string[] => {
  const { rule, referenceMetadata, tag } = params
  const { pathOrder, pathToInfo } = buildPathStructure(rule, tag)

  const result: string[] = []
  const referenceKeys = referenceMetadata ? Object.keys(referenceMetadata as object) : []

  for (const path of pathOrder) {
    const info = pathToInfo.get(pathKey(path))
    if (!info) continue
    const keysAtPath = info.orderByRule.map(({ key }) => key)
    if (referenceMetadata === undefined) {
      result.push(...keysAtPath)
      continue
    }
    const keysFromReference = referenceKeys.filter((k) => keysAtPath.includes(k))
    const refSet = new Set(keysFromReference)
    const remaining = keysAtPath.filter((k) => !refSet.has(k))
    result.push(...keysFromReference, ...remaining)
  }

  return result
}

export const getOrderedKeysFromXML = <Rule extends MetadataItemRule>(params: {
  rule: Rule
  xml: Record<string, unknown> | undefined
  tags?: string[]
}): string[] => {
  const { rule, xml, tags } = params
  const structure = buildPathStructure(rule, tags)

  const allKeysFallback: string[] = []
  for (const path of structure.pathOrder) {
    const info = structure.pathToInfo.get(pathKey(path))
    if (info) allKeysFallback.push(...info.orderByRule.map(({ key }) => key))
  }
  if (xml === undefined) {
    return allKeysFallback
  }

  const walkXml = (node: unknown, pathPrefix: Path): string[] => {
    if (node === null || node === undefined || typeof node !== "object" || Array.isArray(node)) {
      return []
    }
    const obj = node as Record<string, unknown>
    const pk = pathKey(pathPrefix)
    const info = structure.pathToInfo.get(pk)
    const childContainers = structure.childContainersByPath.get(pk) ?? new Set<string>()
    const propsAtPath = info?.xmlKeyToKey ?? {}
    const added = new Set<string>()
    const result: string[] = []

    for (const k of Object.keys(obj)) {
      if (childContainers.has(k)) {
        const nested = walkXml(obj[k], pathPrefix.concat([k]))
        for (const key of nested) {
          if (!added.has(key)) {
            added.add(key)
            result.push(key)
          }
        }
      } else if (propsAtPath[k] !== undefined) {
        const key = propsAtPath[k]!
        if (!added.has(key)) {
          added.add(key)
          result.push(key)
        }
      }
    }

    if (info) {
      for (const key of info.keys) {
        if (!added.has(key)) result.push(key)
      }
    }
    return result
  }

  return walkXml(xml, [])
}

export const getValueOrDefault = (params: {
  context: ConfigurationContext
  rule: PropertyRule
  value: any
  name?: string
  operation: TypeRulesOperations
}): any => {
  const { context, rule, value, name, operation } = params

  if (value !== undefined) {
    return value
  }

  if (typeof rule.defaultValue === "function") {
    return rule.defaultValue({ context, name, operation })
  }

  return rule.defaultValue
}
