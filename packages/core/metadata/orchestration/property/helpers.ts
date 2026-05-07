import { capitalize } from "~/helpers/capitalize"
import { ConfigurationContext } from "~/metadata/context/types"
import { ToMetadata } from ".."
import { isCypherPredicate } from "./cypherPredicate"
import { TypeRulesOperations } from "./fn"
import { ItemXML, MetadataItemRule, PropertyRule } from "./types"

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
  context?: import("~/metadata/context/types").ConfigurationContextWithExportToXML
  propertyKey?: string
  referenceMetadata?: unknown
}): boolean => {
  const { rule, operation, metadataItem, context, propertyKey, referenceMetadata } = params

  if (rule.runtimeOnly) return false

  switch (operation) {
    case "exportToXML":
      if (rule.toXML === false) return false
      if (rule.filePath !== undefined) return false
      if (rule.preserveFromReferenceXML === true) {
        if (propertyKey === undefined) return false
        if (referenceMetadata === null || referenceMetadata === undefined || typeof referenceMetadata !== "object") return false
        return Object.hasOwn(referenceMetadata, propertyKey)
      }
      if (typeof rule.toXML === "function") return rule.toXML(metadataItem, context)
      if (isCypherPredicate(rule.toXML)) return shouldProcessCypherPredicate(rule.toXML, metadataItem, context)
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

const shouldProcessCypherPredicate = (
  predicate: import("./cypherPredicate").CypherPredicate,
  metadataItem: unknown,
  context?: import("~/metadata/context/types").ConfigurationContextWithExportToXML,
): boolean => {
  const cache = context?.exportToXML?.cypherCache
  if (!cache) return false
  const rows = cache.get(predicate.query)
  if (rows === undefined) return false
  return predicate.test(metadataItem, rows)
}

const buildPathStructure = <Rule extends MetadataItemRule>(
  rule: Rule,
  tagFilter: string[] | undefined,
  /** При экспорте в XML задаёт порядок свойств без `order` (порядок ключей как в референсе после импорта). */
  referenceMetadata?: ToMetadata<Rule["itemType"]> | null
): PathStructure => {
  const pathOrder: Path[] = []
  const pathOrderSet = new Set<string>()
  const pathToInfo = new Map<string, PathInfo>()

  const propertyEntries = Object.entries(rule.properties).filter(([_key, ruleProp]) => {
    if (ruleProp.runtimeOnly) return false
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

  const refKeyOrder = new Map<string, number>()
  if (referenceMetadata !== undefined && referenceMetadata !== null && typeof referenceMetadata === "object") {
    let i = 0
    for (const k of Object.keys(referenceMetadata)) {
      if (k === "itemType") continue
      if (!refKeyOrder.has(k)) refKeyOrder.set(k, i++)
    }
  }

  for (const info of Array.from(pathToInfo.values())) {
    info.orderByRule.sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined) return a.order - b.order
      if (a.order !== undefined) return -1
      if (b.order !== undefined) return 1
      if (refKeyOrder.size > 0) {
        const ia = refKeyOrder.get(a.key)
        const ib = refKeyOrder.get(b.key)
        if (ia !== undefined && ib !== undefined) return ia - ib
        if (ia !== undefined) return -1
        if (ib !== undefined) return 1
      }
      return a.xmlKey.localeCompare(b.xmlKey)
    })
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
  referenceMetadata: ToMetadata<Rule["itemType"]> | undefined
  tag?: string[]
}): string[] => {
  const { rule, referenceMetadata, tag } = params
  const { pathOrder, pathToInfo } = buildPathStructure(rule, tag, referenceMetadata)

  // Если есть референс (например, метаданные, полученные из импорта XML), порядок ключей
  // в нём имеет приоритет над `order` из правил — это нужно, чтобы round-trip сохранял
  // порядок тегов, даже когда часть полей уходит во вложенный контейнер (xmlParents),
  // или когда разные XML-источники раскладывают свойства в разном порядке.
  const refKeyOrder = new Map<string, number>()
  if (referenceMetadata !== undefined && referenceMetadata !== null && typeof referenceMetadata === "object") {
    let i = 0
    for (const k of Object.keys(referenceMetadata)) {
      if (k === "itemType") continue
      if (!refKeyOrder.has(k)) refKeyOrder.set(k, i++)
    }
  }

  type FlatEntry = { key: string; order: number | undefined; pathIdx: number; withinPathIdx: number }
  const entries: FlatEntry[] = []

  for (let pathIdx = 0; pathIdx < pathOrder.length; pathIdx++) {
    const info = pathToInfo.get(pathKey(pathOrder[pathIdx]!))
    if (!info) continue
    info.orderByRule.forEach((e, withinPathIdx) => {
      entries.push({ key: e.key, order: e.order, pathIdx, withinPathIdx })
    })
  }

  const byRuleOrder = (a: FlatEntry, b: FlatEntry): number => {
    if (a.order !== undefined && b.order !== undefined) return a.order - b.order
    if (a.order !== undefined) return -1
    if (b.order !== undefined) return 1
    if (a.pathIdx !== b.pathIdx) return a.pathIdx - b.pathIdx
    return a.withinPathIdx - b.withinPathIdx
  }

  if (refKeyOrder.size === 0) {
    entries.sort(byRuleOrder)
    return entries.map((e) => e.key)
  }

  // Референс задаёт относительный порядок для своих ключей; ключи, которых в референсе
  // нет (авто-эмитятся экспортом — например, `<dcssch:value xsi:nil/>`), вставляются
  // между ними по правилу: перед первым anchored-ключом с бо́льшим `order`.
  const anchored: FlatEntry[] = []
  const free: FlatEntry[] = []
  for (const e of entries) {
    if (refKeyOrder.has(e.key)) anchored.push(e)
    else free.push(e)
  }
  anchored.sort((a, b) => refKeyOrder.get(a.key)! - refKeyOrder.get(b.key)!)
  free.sort(byRuleOrder)

  const result: FlatEntry[] = [...anchored]
  for (const f of free) {
    if (f.order === undefined) {
      result.push(f)
      continue
    }
    let insertIdx = result.length
    for (let i = 0; i < result.length; i++) {
      const r = result[i]!
      if (r.order !== undefined && r.order > f.order) {
        insertIdx = i
        break
      }
    }
    result.splice(insertIdx, 0, f)
  }

  return result.map((e) => e.key)
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

export const applyRequiredXMLParents = (
  result: ItemXML,
  entries: ReadonlyArray<ReadonlyArray<string> | { path: ReadonlyArray<string>; tag?: string }>,
  tag?: string[]
): void => {
  for (const entry of entries) {
    const path = "path" in entry ? entry.path : entry
    const entryTag = "path" in entry ? entry.tag : undefined
    if (entryTag !== undefined && (tag === undefined || !tag.includes(entryTag))) continue
    let node = result
    for (const key of path) {
      if (node[key] === undefined) {
        node[key] = {}
      }
      node = node[key]
    }
  }
}
