import { capitalize } from "../../../helpers/capitalize"
import type { XmlAttributeNode, XmlElementNode } from "../../../xml/import/document"

import { shouldProcessProperty } from "./helpers"
import type { MetadataItemRule, PropertyRule } from "./types"
import type {
  XmlImportAuditBoundary,
  XmlImportAuditSession,
} from "../xmlAnomaly/importAudit"
import {
  xmlImportCompatibilityValue,
  xmlImportCompatibilityValues,
} from "../xmlAnomaly/compatibilityView"

export interface XMLImportPlanEntry {
  propertyKey: string
  rule: PropertyRule
  canonicalXMLKey: string
}

export interface XMLImportMatch extends XMLImportPlanEntry {
  sourceXMLKey: string
  xmlPath: readonly string[]
  xmlValue: unknown
  xmlNode?: XmlElementNode | XmlAttributeNode
  xmlNodes?: readonly (XmlElementNode | XmlAttributeNode)[]
  ambiguousXMLKey: boolean
}

export interface XMLImportPlan {
  readonly defaults: readonly XMLImportPlanEntry[]
  readonly entriesByPropertyKey: ReadonlyMap<string, XMLImportPlanEntry>
}

interface XMLImportPlanNode {
  readonly entriesByXMLKey: Map<string, XMLImportPlanEntry[]>
  readonly childrenByXMLKey: Map<string, XMLImportPlanNode>
}

interface CompiledXMLImportPlan extends XMLImportPlan {
  readonly itemType: string
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
  entry: XMLImportPlanEntry
}): void => {
  const entries = params.node.entriesByXMLKey.get(params.xmlKey)
  if (entries === undefined) {
    params.node.entriesByXMLKey.set(params.xmlKey, [params.entry])
    return
  }
  if (!entries.some(({ propertyKey }) => propertyKey === params.entry.propertyKey)) entries.push(params.entry)
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

    const needsAbsentXMLImport =
      Object.prototype.hasOwnProperty.call(propertyRule, "defaultValue") ||
      Object.prototype.hasOwnProperty.call(propertyRule, "implicitValueXML")
    if (needsAbsentXMLImport && shouldProcessProperty({ rule: propertyRule, operation: "importFromXML" })) {
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
      registerXMLKey({ node, xmlKey, entry })
    }
  }

  return { itemType: params.rule.itemType, root, defaults, entriesByPropertyKey }
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
  visitedPropertyKeys: Set<string>,
  visit: (match: XMLImportMatch) => void
): void => {
  if (!isRecord(xml)) return

  for (const [xmlKey, xmlValue] of Object.entries(xml)) {
    const propertyXMLPath = [...xmlPath, xmlKey]
    const entries = node.entriesByXMLKey.get(xmlKey) ?? []
    for (const entry of entries) {
      if (visitedPropertyKeys.has(entry.propertyKey)) continue
      visitedPropertyKeys.add(entry.propertyKey)
      visit({
        ...entry,
        sourceXMLKey: xmlKey,
        xmlPath: propertyXMLPath,
        xmlValue,
        ambiguousXMLKey: entries.length > 1,
      })
    }

    const child = node.childrenByXMLKey.get(xmlKey)
    if (child !== undefined) visitNode(child, xmlValue, propertyXMLPath, visitedPropertyKeys, visit)
  }
}

export const visitXMLImportPlan = (params: {
  plan: XMLImportPlan
  xml: Record<string, unknown> | XmlElementNode
  audit?: XmlImportAuditSession
  auditBoundary?(entry: XMLImportPlanEntry): XmlImportAuditBoundary
  isRepeatable?(entry: XMLImportPlanEntry): boolean
  claimRoot?: boolean
  visit(match: XMLImportMatch): void
}): void => {
  const compiled = params.plan as CompiledXMLImportPlan
  if (isXmlElementNode(params.xml)) {
    visitStructuralXMLImportPlan({
      plan: compiled,
      root: params.xml,
      audit: params.audit,
      auditBoundary: params.auditBoundary,
      isRepeatable: params.isRepeatable,
      claimRoot: params.claimRoot,
      visit: params.visit,
    })
    return
  }
  visitNode(compiled.root, params.xml, [], new Set(), params.visit)
}

interface StructuralCandidate {
  readonly entry: XMLImportPlanEntry
  readonly sourceXMLKey: string
  readonly xmlPath: readonly string[]
  readonly xmlNode: XmlElementNode | XmlAttributeNode
  readonly entriesAtNode: readonly XMLImportPlanEntry[]
}

function visitStructuralXMLImportPlan(params: {
  readonly plan: CompiledXMLImportPlan
  readonly root: XmlElementNode
  readonly audit?: XmlImportAuditSession
  readonly auditBoundary?: (entry: XMLImportPlanEntry) => XmlImportAuditBoundary
  readonly isRepeatable?: (entry: XMLImportPlanEntry) => boolean
  readonly claimRoot?: boolean
  readonly visit: (match: XMLImportMatch) => void
}): void {
  const itemBoundary: XmlImportAuditBoundary = { itemType: params.plan.itemType }
  const boundaryForEntry = params.auditBoundary ?? (
    (entry: XMLImportPlanEntry) => defaultPropertyBoundary(params.plan.itemType, entry)
  )
  if (params.claimRoot !== false) params.audit?.claim(params.root, itemBoundary)
  const candidates: StructuralCandidate[] = []
  collectStructuralCandidates({
    node: params.plan.root,
    xml: params.root,
    xmlPath: [],
    itemBoundary,
    audit: params.audit,
    candidates,
  })

  const candidatesByProperty = new Map<string, StructuralCandidate[]>()
  for (const candidate of candidates) {
    const current = candidatesByProperty.get(candidate.entry.propertyKey)
    if (current === undefined) candidatesByProperty.set(candidate.entry.propertyKey, [candidate])
    else current.push(candidate)
  }

  const selected = new Map<
    StructuralCandidate,
    { readonly candidates: readonly StructuralCandidate[]; readonly repeatable: boolean }
  >()
  for (const propertyCandidates of candidatesByProperty.values()) {
    const canonical = propertyCandidates.filter(
      ({ entry, sourceXMLKey }) => sourceXMLKey === entry.canonicalXMLKey,
    )
    const matchingSource = canonical.length > 0
      ? canonical
      : propertyCandidates.filter(
          ({ sourceXMLKey }) => sourceXMLKey === propertyCandidates[0]!.sourceXMLKey,
        )
    const repeatable = params.isRepeatable?.(propertyCandidates[0]!.entry) === true
    selected.set(matchingSource[0]!, {
      candidates: repeatable ? matchingSource : [matchingSource[0]!],
      repeatable,
    })
    auditPropertyCandidates(
      propertyCandidates,
      params.audit,
      boundaryForEntry,
      repeatable,
    )
  }

  for (const candidate of candidates) {
    const selection = selected.get(candidate)
    if (selection === undefined) continue
    const selectedCandidates = selection.candidates
    const selectedElements = selectedCandidates.flatMap(({ xmlNode }) =>
      "type" in xmlNode ? [xmlNode] : [],
    )
    params.visit({
      ...candidate.entry,
      sourceXMLKey: candidate.sourceXMLKey,
      xmlPath: candidate.xmlPath,
      xmlValue: selection.repeatable && selectedCandidates.length > 1
        ? xmlImportCompatibilityValues({
            nodes: selectedElements,
            audit: params.audit,
            boundary: boundaryForEntry(candidate.entry),
          })
        : selectedCandidates.length === 1
          ? xmlImportCompatibilityValue({
              node: candidate.xmlNode,
              audit: params.audit,
              boundary: boundaryForEntry(candidate.entry),
            })
          : selectedCandidates.map(({ entry, xmlNode }) => xmlImportCompatibilityValue({
              node: xmlNode,
              audit: params.audit,
              boundary: boundaryForEntry(entry),
            })),
      xmlNode: candidate.xmlNode,
      xmlNodes: selectedCandidates.map(({ xmlNode }) => xmlNode),
      ambiguousXMLKey:
        candidate.entriesAtNode.length > 1 ||
        (candidatesByProperty.get(candidate.entry.propertyKey)?.some(
          ({ sourceXMLKey }) => sourceXMLKey !== candidate.sourceXMLKey,
        ) ?? false),
    })
  }
}

function collectStructuralCandidates(params: {
  readonly node: XMLImportPlanNode
  readonly xml: XmlElementNode
  readonly xmlPath: readonly string[]
  readonly itemBoundary: XmlImportAuditBoundary
  readonly audit?: XmlImportAuditSession
  readonly candidates: StructuralCandidate[]
}): void {
  for (const attribute of params.xml.attributes) {
    appendStructuralCandidates(params, `_${attribute.name}`, attribute)
  }
  for (const child of elementChildren(params.xml)) {
    const hasEntries = appendStructuralCandidates(params, child.name, child)
    const childPlan = params.node.childrenByXMLKey.get(child.name)
    if (childPlan === undefined) continue
    if (!hasEntries) params.audit?.claim(child, params.itemBoundary)
    collectStructuralCandidates({
      ...params,
      node: childPlan,
      xml: child,
      xmlPath: [...params.xmlPath, child.name],
    })
  }
}

function appendStructuralCandidates(
  params: {
    readonly node: XMLImportPlanNode
    readonly xmlPath: readonly string[]
    readonly candidates: StructuralCandidate[]
  },
  sourceXMLKey: string,
  xmlNode: XmlElementNode | XmlAttributeNode,
): boolean {
  const entriesAtNode = params.node.entriesByXMLKey.get(sourceXMLKey) ?? []
  for (const entry of entriesAtNode) {
    params.candidates.push({
      entry,
      sourceXMLKey,
      xmlPath: [...params.xmlPath, sourceXMLKey],
      xmlNode,
      entriesAtNode,
    })
  }
  return entriesAtNode.length > 0
}

function auditPropertyCandidates(
  candidates: readonly StructuralCandidate[],
  audit: XmlImportAuditSession | undefined,
  boundaryForEntry: (entry: XMLImportPlanEntry) => XmlImportAuditBoundary,
  repeatable: boolean,
): void {
  if (audit === undefined) return
  const sourceKeys = new Set(candidates.map(({ sourceXMLKey }) => sourceXMLKey))
  if (sourceKeys.size > 1) {
    for (const candidate of candidates) {
      audit.ambiguous(candidate.xmlNode, boundariesAtNode(candidate, boundaryForEntry))
    }
    return
  }

  candidates.forEach((candidate, index) => {
    const boundaries = boundariesAtNode(candidate, boundaryForEntry)
    if (boundaries.length > 1) {
      audit.ambiguous(candidate.xmlNode, boundaries)
      return
    }
    const boundary = boundaries[0]!
    if (repeatable) return
    if (index === 0) audit.claim(candidate.xmlNode, boundary)
    else audit.duplicate(candidate.xmlNode, boundary)
  })
}

function boundariesAtNode(
  candidate: StructuralCandidate,
  boundaryForEntry: (entry: XMLImportPlanEntry) => XmlImportAuditBoundary,
): XmlImportAuditBoundary[] {
  return candidate.entriesAtNode.map(boundaryForEntry)
}

function defaultPropertyBoundary(
  itemType: string,
  { propertyKey, rule }: XMLImportPlanEntry,
): XmlImportAuditBoundary {
  return { itemType, propertyKey, propertyType: rule.type }
}

function elementChildren(node: XmlElementNode): XmlElementNode[] {
  return node.content.filter((child): child is XmlElementNode => child.type === "element")
}

function isXmlElementNode(value: unknown): value is XmlElementNode {
  return value !== null &&
    typeof value === "object" &&
    "type" in value &&
    value.type === "element" &&
    "compatibilityValue" in value
}
