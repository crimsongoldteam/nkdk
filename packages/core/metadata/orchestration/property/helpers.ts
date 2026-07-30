import { capitalize } from "../../../helpers/capitalize"
import { ConfigurationContext } from "../../context/types"
import { TypeRulesOperations } from "./fn"
import type { ItemXML, MetadataItemRule, PropertyRule } from "./types"
import { getCompiledXMLPropertyOrder } from "./xmlPropertyOrder"

type Path = string[]

const pathKey = (path: Path): string => JSON.stringify(path)

interface PathInfo {
  keys: string[]
  xmlKeyToKey: Record<string, string>
}

interface PathStructure {
  pathOrder: Path[]
  pathToInfo: Map<string, PathInfo>
  childContainersByPath: Map<string, Set<string>>
}

export const XML_SOURCE_KEYS = Symbol("xmlSourceKeys")

const AUTO_REQUIRED_XML_PARENT_ROOTS = new Set<string>(["ChildObjects", "ListSettings"])

export const collectAutoRequiredXMLParentRoot = (rule: PropertyRule, roots: Set<string>): void => {
  const root = rule.xmlParents?.[0]
  if (root !== undefined && AUTO_REQUIRED_XML_PARENT_ROOTS.has(root)) {
    roots.add(root)
  }
}

export const applyAutoRequiredXMLParents = (result: ItemXML, roots: ReadonlySet<string>): void => {
  for (const root of roots) {
    if (result[root] === undefined) {
      result[root] = {}
    }
  }
}

type PropertyExportImportOperation =
  | "exportToXML"
  | "importFromXML"
  | "exportToYAML"
  | "importFromYAML"
  | "exportToEnterprise"

export const shouldProcessProperty = (params: {
  rule: PropertyRule
  operation: PropertyExportImportOperation
  metadataItem?: any
  context?: import("../../context/types").ConfigurationContextWithExportToXML
  propertyKey?: string
  referenceMetadata?: unknown
}): boolean => {
  const { rule, operation, metadataItem, context, propertyKey, referenceMetadata } = params

  if (rule.runtimeOnly) return false
  if (rule.syncExternalOnly) return false

  switch (operation) {
    case "exportToXML":
      if (rule.toXML === false) return false
      if (rule.filePath !== undefined) return false
      if (rule.preserveFromReferenceXML === true) {
        if (propertyKey === undefined) return false

        const metadataHasOwnKey =
          metadataItem !== null &&
          metadataItem !== undefined &&
          typeof metadataItem === "object" &&
          Object.prototype.hasOwnProperty.call(metadataItem, propertyKey)

        if (metadataHasOwnKey) return true
        if (referenceMetadata === null || referenceMetadata === undefined || typeof referenceMetadata !== "object") {
          return rule.exportWithoutReferenceXML === true
        }

        const referenceSourceKeys = (referenceMetadata as Record<PropertyKey, unknown>)[XML_SOURCE_KEYS]
        if (
          referenceSourceKeys !== undefined &&
          referenceSourceKeys !== null &&
          typeof referenceSourceKeys === "object"
        ) {
          return Object.prototype.hasOwnProperty.call(referenceSourceKeys, propertyKey)
        }

        return Object.prototype.hasOwnProperty.call(referenceMetadata, propertyKey)
      }
      if (typeof rule.toXML === "function") return rule.toXML(metadataItem, context)
      return true
    case "importFromXML":
      if (rule.filePath !== undefined) return false
      return rule.fromXML !== false
    case "exportToYAML":
      if (rule.toYAML === false) return false
      return true
    case "importFromYAML":
      return rule.fromYAML !== false
    case "exportToEnterprise":
      return rule.toEnterprise !== false
    default:
      return true
  }
}

const buildPathStructure = <Rule extends MetadataItemRule>(
  rule: Rule,
  tagFilter: string[] | undefined
): PathStructure => {
  const pathOrder: Path[] = []
  const pathOrderSet = new Set<string>()
  const pathToInfo = new Map<string, PathInfo>()

  const propertyEntries = Object.entries(rule.properties).filter(([_key, ruleProp]) => {
    if (ruleProp.runtimeOnly) return false
    if (ruleProp.syncExternalOnly) return false
    if (ruleProp.filePath !== undefined) return false
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
    const xmlAliases = (ruleProp as any).xmlAliases ?? []
    if (!info) {
      const xmlKeyToKey: Record<string, string> = { [xmlKey]: key }
      for (const xmlAlias of xmlAliases) xmlKeyToKey[xmlAlias] = key
      pathToInfo.set(pk, {
        keys: [key],
        xmlKeyToKey,
      })
    } else {
      info.keys.push(key)
      info.xmlKeyToKey[xmlKey] = key
      for (const xmlAlias of xmlAliases) info.xmlKeyToKey[xmlAlias] = key
    }
  }

  // Compute child containers for all traversal paths, including ancestor paths not in
  // pathOrder (e.g. the root [] path when the shallowest xmlParents is ["SomeTag"]).
  const allTraversalPaths = new Set<string>([pathKey([])])
  for (const path of pathOrder) {
    for (let i = 1; i <= path.length; i++) {
      allTraversalPaths.add(pathKey(path.slice(0, i)))
    }
  }
  const childContainersByPath = new Map<string, Set<string>>()
  for (const pk of allTraversalPaths) {
    const parsedPath = JSON.parse(pk) as Path
    const set = new Set<string>()
    for (const other of pathOrder) {
      if (
        other.length === parsedPath.length + 1 &&
        other.slice(0, parsedPath.length).every((s, i) => s === parsedPath[i])
      ) {
        set.add(other[parsedPath.length]!)
      }
    }
    childContainersByPath.set(pk, set)
  }

  return { pathOrder, pathToInfo, childContainersByPath }
}

export const getOrderedKeysToXML = <Rule extends MetadataItemRule>(params: {
  rule: Rule
  tag?: string[]
}): string[] =>
  getCompiledXMLPropertyOrder(params.rule).filter((key) => {
    const ruleProp = params.rule.properties[key]!
    if (ruleProp.runtimeOnly || ruleProp.syncExternalOnly || ruleProp.filePath !== undefined) return false
    return params.tag === undefined || (ruleProp.tag !== undefined && params.tag.includes(ruleProp.tag))
  })

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
    if (info) allKeysFallback.push(...info.keys)
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
      const directKey = propsAtPath[k]
      if (directKey !== undefined && !added.has(directKey)) {
        added.add(directKey)
        result.push(directKey)
      }

      if (childContainers.has(k)) {
        const nested = walkXml(obj[k], pathPrefix.concat([k]))
        for (const key of nested) {
          if (!added.has(key)) {
            added.add(key)
            result.push(key)
          }
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

  const fromXml = walkXml(xml, [])
  if (fromXml.length === allKeysFallback.length) {
    return fromXml
  }

  const added = new Set(fromXml)
  const result = [...fromXml]

  for (const key of allKeysFallback) {
    if (!added.has(key)) {
      added.add(key)
      result.push(key)
    }
  }

  return result
}

export const getValueOrDefault = (params: {
  context: ConfigurationContext
  rule: PropertyRule
  value: any
  yaml?: any
  name?: string
  operation: TypeRulesOperations
}): any => {
  const { context, rule, value, yaml, name, operation } = params

  if (value !== undefined) {
    return value
  }

  if (typeof rule.defaultValue === "function") {
    return rule.defaultValue({ context, yaml, name, operation })
  }

  return rule.defaultValue
}
