import { capitalize } from "../../../helpers/capitalize"

import { shouldProcessProperty } from "./helpers"
import type { MetadataItemRule, PropertyRule } from "./types"

export interface XMLImportPlanEntry {
  propertyKey: string
  rule: PropertyRule
  canonicalXMLKey: string
}

export interface XMLImportMatch extends XMLImportPlanEntry {
  sourceXMLKey: string
  xmlPath: readonly string[]
  xmlValue: unknown
}

export interface XMLImportPlan {
  readonly defaults: readonly XMLImportPlanEntry[]
  readonly entriesByPropertyKey: ReadonlyMap<string, XMLImportPlanEntry>
}

interface XMLImportPlanNode {
  readonly entriesByXMLKey: Map<string, XMLImportPlanEntry>
  readonly childrenByXMLKey: Map<string, XMLImportPlanNode>
}

interface CompiledXMLImportPlan extends XMLImportPlan {
  readonly root: XMLImportPlanNode
}

const cache = new WeakMap<MetadataItemRule, Map<string, CompiledXMLImportPlan>>()

const createNode = (): XMLImportPlanNode => ({
  entriesByXMLKey: new Map(),
  childrenByXMLKey: new Map(),
})

const getCacheKey = (params: { tags?: readonly string[]; includeAllTags: boolean }): string =>
  params.includeAllTags ? "*" : JSON.stringify([...(params.tags ?? [])].sort())

const matchesSource = (params: {
  propertyRule: PropertyRule
  tags?: readonly string[]
  includeAllTags: boolean
}): boolean => {
  if (params.includeAllTags) return true
  if (params.tags === undefined) return params.propertyRule.tag === undefined
  return params.propertyRule.tag !== undefined && params.tags.includes(params.propertyRule.tag)
}

const registerXMLKey = (params: {
  node: XMLImportPlanNode
  xmlKey: string
  xmlPath: readonly string[]
  entry: XMLImportPlanEntry
}): void => {
  const existing = params.node.entriesByXMLKey.get(params.xmlKey)
  if (existing !== undefined && existing.propertyKey !== params.entry.propertyKey) {
    throw new Error(
      `XML-путь /${[...params.xmlPath, params.xmlKey].join("/")} соответствует свойствам ${existing.propertyKey} и ${params.entry.propertyKey}`
    )
  }
  params.node.entriesByXMLKey.set(params.xmlKey, params.entry)
}

const compileXMLImportPlan = (params: {
  rule: MetadataItemRule
  tags?: readonly string[]
  includeAllTags: boolean
}): CompiledXMLImportPlan => {
  const root = createNode()
  const defaults: XMLImportPlanEntry[] = []
  const entriesByPropertyKey = new Map<string, XMLImportPlanEntry>()

  for (const [propertyKey, propertyRule] of Object.entries(params.rule.properties)) {
    if (propertyRule.runtimeOnly || propertyRule.syncExternalOnly) continue
    if (!matchesSource({ propertyRule, tags: params.tags, includeAllTags: params.includeAllTags })) continue

    const entry: XMLImportPlanEntry = {
      propertyKey,
      rule: propertyRule,
      canonicalXMLKey: propertyRule.xml ?? capitalize(propertyKey),
    }
    entriesByPropertyKey.set(propertyKey, entry)

    if (propertyRule.filePath !== undefined) continue
    if (!shouldProcessProperty({ rule: propertyRule, operation: "importFromXML" })) continue

    if (Object.prototype.hasOwnProperty.call(propertyRule, "defaultValue")) {
      defaults.push(entry)
    }

    let node = root
    const xmlParents = propertyRule.xmlParents ?? []
    for (const xmlParent of xmlParents) {
      let child = node.childrenByXMLKey.get(xmlParent)
      if (child === undefined) {
        child = createNode()
        node.childrenByXMLKey.set(xmlParent, child)
      }
      node = child
    }

    for (const xmlKey of [entry.canonicalXMLKey, ...(propertyRule.xmlAliases ?? [])]) {
      registerXMLKey({ node, xmlKey, xmlPath: xmlParents, entry })
    }
  }

  return { root, defaults, entriesByPropertyKey }
}

export const getXMLImportPlan = (params: {
  rule: MetadataItemRule
  tags?: readonly string[]
  includeAllTags: boolean
}): XMLImportPlan => {
  let plansBySource = cache.get(params.rule)
  if (plansBySource === undefined) {
    plansBySource = new Map()
    cache.set(params.rule, plansBySource)
  }

  const cacheKey = getCacheKey(params)
  const cached = plansBySource.get(cacheKey)
  if (cached !== undefined) return cached

  const compiled = compileXMLImportPlan(params)
  plansBySource.set(cacheKey, compiled)
  return compiled
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value)

const visitNode = (
  node: XMLImportPlanNode,
  xml: unknown,
  xmlPath: readonly string[],
  visit: (match: XMLImportMatch) => void
): void => {
  if (!isRecord(xml)) return

  for (const [xmlKey, xmlValue] of Object.entries(xml)) {
    const propertyXMLPath = [...xmlPath, xmlKey]
    const entry = node.entriesByXMLKey.get(xmlKey)
    if (entry !== undefined) {
      visit({ ...entry, sourceXMLKey: xmlKey, xmlPath: propertyXMLPath, xmlValue })
    }

    const child = node.childrenByXMLKey.get(xmlKey)
    if (child !== undefined) visitNode(child, xmlValue, propertyXMLPath, visit)
  }
}

export const visitXMLImportPlan = (params: {
  plan: XMLImportPlan
  xml: Record<string, unknown>
  visit(match: XMLImportMatch): void
}): void => {
  const compiled = params.plan as CompiledXMLImportPlan
  visitNode(compiled.root, params.xml, [], params.visit)
}
