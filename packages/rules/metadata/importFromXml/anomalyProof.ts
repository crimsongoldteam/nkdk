import {
  createXmlElementPatch,
  createXmlRuleAddressIndex,
  compareXmlStructureDifferences,
  decodeXmlRawValue,
  isExplicitYAMLString,
  copyYAMLRuntimeMetadata,
  markYAMLMappingKeyOrder,
  parseXmlDocumentWithSaxes,
  restoreXmlAnomalyAnnotations,
  snapshotXmlAnomalyAnnotations,
  xmlElementRawValue,
  yamlMappingKeys,
  type XmlAnomalyAnnotationsSnapshot,
  type XmlDocument,
  type XmlElementNode,
  type XmlImportAuditBoundary,
  type XmlImportAuditedNode,
  type XmlImportAuditOutcome,
  type XmlImportAuditSession,
  type XmlSourceSpan,
  type XmlRawValue,
  type XmlRuleAddress,
  type XmlRuleAddressIndex,
  type XmlStructureDifference,
} from "@nkdk/runtime"
import {
  getCompiledXMLPropertyOrder,
  getTypeRule,
  getYAMLToXMLPlan,
  type MetadataItemRule,
  type PropertyRule,
  type YAMLToXMLNestedRule,
} from "@nkdk/runtime/rule-kit"
import type { ImportXmlInput } from "./types"
import {
  transformedXmlRootsAreExact,
  type XmlProofTransformation,
} from "./xmlProofVerification"
import {
  localizeXmlDifferences,
  type LocalizedXmlDifference,
  type UnlocalizedXmlDifference,
  type UnlocalizedXmlDifferenceReason,
} from "./xmlDifferenceLocalization"

let xmlPathIndexVisitCountValueForTests = 0

export function xmlPathIndexVisitCountForTests(): number {
  return xmlPathIndexVisitCountValueForTests
}

export function resetXmlPathIndexVisitCountForTests(): void {
  xmlPathIndexVisitCountValueForTests = 0
}

export interface XmlAnomalyProofLevel {
  readonly xmlPath: string
  readonly yamlPath: readonly (string | number)[]
  readonly rawYamlPath?: readonly (string | number)[]
  readonly protectedYamlPaths?: readonly (readonly (string | number)[])[]
  readonly elementName: string
  readonly structuralHash: bigint
  readonly span: XmlSourceSpan
}

export interface XmlAnomalyProofBoundary {
  readonly sourcePath: string
  readonly sourceRole: ImportXmlInput["role"]
  readonly xmlPath: string
  readonly yamlPath: readonly (string | number)[]
  readonly rulePath: readonly string[]
  readonly presentInSource: boolean
  readonly auditState?: "semanticallyElided" | "externallyPersisted" | "structurallyClaimed"
  readonly targetPaths?: readonly string[]
  readonly levels?: readonly XmlAnomalyProofLevel[]
  readonly capturedTargets?: readonly {
    readonly path: string
    readonly signature: bigint | string
    readonly span: XmlSourceSpan
  }[]
}

export interface XmlAnomalyProofSource {
  readonly sourcePath: string
  readonly role: ImportXmlInput["role"]
  readonly document: XmlDocument
}

export type XmlAnomalyProofAuditBoundary = XmlAnomalyProofBoundary & {
  readonly targets: readonly {
    readonly path: string
    readonly signature: bigint | string
    readonly span: XmlSourceSpan
  }[]
  readonly levels: readonly XmlAnomalyProofLevel[]
}

export interface XmlAnomalyProofAudit {
  readonly sources: readonly {
    readonly sourcePath: string
    readonly role: ImportXmlInput["role"]
    readonly roots: readonly {
      readonly xmlPath: string
      readonly elementName: string
      readonly structuralHash: bigint
      readonly span: XmlSourceSpan
    }[]
  }[]
  readonly boundaries: readonly XmlAnomalyProofAuditBoundary[]
  readonly fallbackBoundaries?: readonly XmlAnomalyProofAuditBoundary[]
  readonly itemAnchors?: readonly XmlAnomalyItemAnchor[]
}

export interface XmlAnomalyItemAnchor {
  readonly sourcePath: string
  readonly xmlPath: string
  readonly yamlPath: readonly (string | number)[]
  readonly rulePath: readonly string[]
}

interface ResolvedXmlAnomalyItemRule extends XmlAnomalyItemAnchor {
  readonly rule: MetadataItemRule
}

interface ResolvedXmlAnomalyItemRuleIndex {
  readonly add: (candidate: ResolvedXmlAnomalyItemRule) => void
  readonly find: (params: {
    readonly sourcePath: string
    readonly rulePath: readonly string[]
    readonly yamlPath: readonly (string | number)[]
    readonly exactYamlPath?: boolean
  }) => ResolvedXmlAnomalyItemRule | undefined
}

interface XmlAnomalyItemAnchorIndex {
  readonly byParent: ReadonlyMap<string, readonly XmlAnomalyItemAnchor[]>
  readonly byNormalizedPath: ReadonlyMap<string, readonly XmlAnomalyItemAnchor[]>
}

interface DeriveXmlAnomalyProofParams {
  readonly sources: readonly XmlAnomalyProofSource[]
  readonly audit: XmlImportAuditSession
  readonly rule: MetadataItemRule
  readonly data?: unknown
}

export function deriveXmlAnomalyProofBoundaries(params: DeriveXmlAnomalyProofParams): XmlAnomalyProofBoundary[] {
  return deriveXmlAnomalyProofPlan({ ...params, includePlannedAbsences: true }).boundaries
}

export function deriveXmlAnomalyProofPlan(
  params: DeriveXmlAnomalyProofParams & { readonly includePlannedAbsences: boolean },
): {
  readonly boundaries: XmlAnomalyProofBoundary[]
  readonly itemAnchors: readonly XmlAnomalyItemAnchor[]
} {
  const nodeSource = new Map<XmlImportAuditedNode, XmlAnomalyProofSource>()
  const elementsBySourcePath = new Map<string, ReadonlyMap<string, XmlElementNode>>()
  for (const source of params.sources) {
    const index = indexXmlDocument(source.document.roots)
    elementsBySourcePath.set(source.sourcePath, index.elements)
    for (const node of index.nodes.values()) nodeSource.set(node, source)
  }
  const grouped = new Map<string, {
    readonly boundary: NonNullable<ReturnType<XmlImportAuditSession["outcomes"]>[number]["boundaries"][number]>
    readonly source: XmlAnomalyProofSource
    readonly auditStates: Set<XmlAnomalyProofBoundary["auditState"]>
    readonly elementPaths: string[]
    readonly targetPaths: string[]
    readonly capturedTargets: {
      readonly path: string
      readonly signature: bigint | string
      readonly span: XmlSourceSpan
    }[]
  }>()
  const itemAnchorsByBoundary = new Map<string, XmlAnomalyItemAnchor>()
  const outcomes: XmlImportAuditOutcome[] = []
  params.audit.forEachOutcome((outcome) => outcomes.push(outcome))
  let shallowElements: ReadonlySet<string> | undefined
  for (const outcome of outcomes) {
    if (
      outcome.state !== "claimed" &&
      outcome.state !== "semanticallyElided" &&
      outcome.state !== "externallyPersisted" &&
      outcome.state !== "structurallyClaimed" &&
      outcome.state !== "duplicate" &&
      outcome.state !== "ambiguous"
    ) continue
    const source = nodeSource.get(outcome.node)
    if (source === undefined) continue
    const elementPath = owningElementPath(outcome.node)
    if ("type" in outcome.node && outcome.node.type === "element") {
      for (const candidate of outcome.boundaries) {
        const anchorRulePath = candidate.rulePath?.map(({ propertyKey }) => propertyKey) ?? []
        if (
          candidate.propertyKey !== undefined ||
          candidate.yamlPath === undefined ||
          anchorRulePath.length === 0
        ) continue
        const anchor = {
          sourcePath: source.sourcePath,
          xmlPath: outcome.node.path,
          yamlPath: [...candidate.yamlPath],
          rulePath: anchorRulePath,
        }
        const key = itemAnchorBoundaryKey(source.sourcePath, candidate)
        const current = itemAnchorsByBoundary.get(key)
        if (current === undefined || compareItemAnchorRoot(anchor, current) < 0) {
          itemAnchorsByBoundary.set(key, anchor)
        }
      }
    }
    for (const boundary of proofBoundariesForOutcome(outcome)) {
      if (boundary.yamlPath === undefined || boundary.yamlPath.length === 0) continue
      // Одна YAML-граница может собираться несколькими вложенными правилами.
      // Для proof это один кандидат raw, поэтому XML-цели объединяются по
      // итоговому YAML-пути, а не по частному PropertyRule.
      const key = JSON.stringify([source.sourcePath, boundary.yamlPath])
      const auditState = proofAuditState(outcome.state)
      const signature = outcome.state === "structurallyClaimed"
        ? auditedNodeSignature(outcome.node, false)
        : auditedNodeSignature(
            outcome.node,
            (shallowElements ??= elementsWithIndependentDescendants(outcomes, nodeSource))
              .has(auditedNodeKey(source.sourcePath, outcome.node.path)),
          )
      const current = grouped.get(key)
      if (current === undefined) {
        grouped.set(key, {
          boundary,
          source,
          auditStates: new Set([auditState]),
          elementPaths: [elementPath],
          targetPaths: [outcome.node.path],
          capturedTargets: [{
            path: outcome.node.path,
            signature,
            span: { ...outcome.node.span },
          }],
        })
      } else {
        current.auditStates.add(auditState)
        current.elementPaths.push(elementPath)
        current.targetPaths.push(outcome.node.path)
        current.capturedTargets.push({
          path: outcome.node.path,
          signature,
          span: { ...outcome.node.span },
        })
      }
    }
  }
  const itemAnchors = [...itemAnchorsByBoundary.values()]
  const resolvedItemRules = resolveDynamicItemRules(params.rule, itemAnchors, params.data)
  const itemAnchorIndex = indexItemAnchors(itemAnchors)
  const boundaries: XmlAnomalyProofBoundary[] = [...grouped.values()].map(({
    boundary,
    source,
    auditStates,
    elementPaths,
    targetPaths,
    capturedTargets,
  }) => {
    const xmlPath = commonElementPath(elementPaths)
    const yamlPath = [...boundary.yamlPath!]
    const rulePath = (boundary.rulePath ?? []).map(({ propertyKey }) => propertyKey)
    const effectiveRulePath = rulePath.length > 0
      ? rulePath
      : boundary.propertyKey === undefined ? [] : [boundary.propertyKey]
    const compiledLevels = compiledProofLevels(
      params.rule,
      effectiveRulePath,
      yamlPath,
      source.sourcePath,
      resolvedItemRules,
    )
    const elements = elementsBySourcePath.get(source.sourcePath)!
    const levels = elementAncestry(elements, xmlPath)
      .slice(0, compiledLevels.length)
      .map((element, index): XmlAnomalyProofLevel => ({
        xmlPath: element.path,
        yamlPath: compiledLevels[index]?.yamlPath ?? yamlPath,
        ...(compiledLevels[index]?.rawYamlPath === undefined
          ? {}
          : { rawYamlPath: compiledLevels[index]!.rawYamlPath }),
        ...(compiledLevels[index]?.protectedYamlPaths.length === 0
          ? {}
          : { protectedYamlPaths: compiledLevels[index]!.protectedYamlPaths }),
        elementName: element.name,
        structuralHash: element.structuralHash,
        span: { ...element.span },
      }))
    return {
      sourcePath: source.sourcePath,
      sourceRole: source.role,
      xmlPath,
      yamlPath,
      rulePath: effectiveRulePath,
      presentInSource: true,
      ...(auditStates.size !== 1 || auditStates.has(undefined)
        ? {}
        : { auditState: [...auditStates][0] }),
      targetPaths: [...new Set(targetPaths)],
      capturedTargets: [...new Map(capturedTargets.map((target) => [target.path, target])).values()],
      levels,
    }
  })

  if (params.includePlannedAbsences) {
    boundaries.push(...deriveXmlAnomalyPlannedAbsenceBoundaries({
      sources: params.sources,
      rule: params.rule,
      data: params.data,
      itemAnchors,
      existingBoundaries: boundaries,
      elementsBySourcePath,
      resolvedItemRules,
      itemAnchorIndex,
    }))
  }
  return { boundaries, itemAnchors }
}

export function deriveXmlAnomalyPlannedAbsenceBoundaries(params: {
  readonly sources: readonly XmlAnomalyProofSource[]
  readonly rule: MetadataItemRule
  readonly data?: unknown
  readonly itemAnchors: readonly XmlAnomalyItemAnchor[]
  readonly existingBoundaries?: readonly XmlAnomalyProofBoundary[]
  readonly elementsBySourcePath?: ReadonlyMap<string, ReadonlyMap<string, XmlElementNode>>
  readonly resolvedItemRules?: ResolvedXmlAnomalyItemRuleIndex
  readonly itemAnchorIndex?: XmlAnomalyItemAnchorIndex
}): XmlAnomalyProofBoundary[] {
  const elementsBySourcePath = params.elementsBySourcePath ?? new Map(params.sources.map((source) => [
    source.sourcePath,
    indexXmlDocument(source.document.roots).elements,
  ] as const))
  const resolvedItemRules = params.resolvedItemRules
    ?? resolveDynamicItemRules(params.rule, params.itemAnchors, params.data)
  const itemAnchorIndex = params.itemAnchorIndex ?? indexItemAnchors(params.itemAnchors)
  const boundaries: XmlAnomalyProofBoundary[] = []
  const existingYamlPaths = new Set((params.existingBoundaries ?? []).map(({ sourcePath, yamlPath }) =>
    JSON.stringify([sourcePath, yamlPath])
  ))
  const existingXmlPaths = new Set((params.existingBoundaries ?? []).map(({ sourcePath, xmlPath }) =>
    JSON.stringify([sourcePath, xmlPath])
  ))
  const metadataSource = params.sources.find(({ role }) => role === "metadata")
  const metadataRoot = metadataSource?.document.roots.find(({ name }) => name === "MetaDataObject")
  if (metadataSource !== undefined && metadataRoot !== undefined) {
    appendPlannedAbsenceBoundaries({
      sources: params.sources,
      elementsBySourcePath,
      boundaries,
      existingYamlPaths,
      existingXmlPaths,
      source: metadataSource,
      root: metadataItemRoot(metadataRoot, params.rule),
      rule: params.rule,
      yamlPrefix: [],
      rulePrefix: [],
      itemAnchors: params.itemAnchors,
      itemAnchorIndex,
      resolvedItemRules,
      data: params.data,
    })
  }
  const bodySource = params.sources.find(({ role }) => role === "body")
  const bodyRoot = bodySource?.document.roots[0]
  if (bodySource !== undefined && bodyRoot !== undefined) {
    appendPlannedAbsenceBoundaries({
      sources: params.sources,
      elementsBySourcePath,
      boundaries,
      existingYamlPaths,
      existingXmlPaths,
      source: bodySource,
      root: bodyRoot,
      rule: params.rule,
      yamlPrefix: [],
      rulePrefix: [],
      itemAnchors: params.itemAnchors,
      itemAnchorIndex,
      resolvedItemRules,
      data: params.data,
    })
  }
  return boundaries
}

function itemAnchorBoundaryKey(
  sourcePath: string,
  boundary: XmlImportAuditBoundary,
): string {
  return JSON.stringify([
    sourcePath,
    boundary.itemType,
    boundary.propertyKey,
    boundary.propertyType,
    boundary.yamlPath,
    boundary.rulePath,
  ])
}

function compareItemAnchorRoot(left: XmlAnomalyItemAnchor, right: XmlAnomalyItemAnchor): number {
  return xmlPathDepth(left.xmlPath) - xmlPathDepth(right.xmlPath)
    || left.xmlPath.localeCompare(right.xmlPath)
}

function xmlPathDepth(path: string): number {
  return path.split("/").length - 1
}

function resolveDynamicItemRules(
  rootRule: MetadataItemRule,
  itemAnchors: readonly XmlAnomalyItemAnchor[],
  data: unknown,
): ResolvedXmlAnomalyItemRuleIndex {
  const uniqueAnchors = [...new Map(itemAnchors.map((anchor) => [
    JSON.stringify([anchor.sourcePath, anchor.xmlPath, anchor.yamlPath, anchor.rulePath]),
    anchor,
  ])).values()].sort((left, right) =>
    left.rulePath.length - right.rulePath.length || left.yamlPath.length - right.yamlPath.length
  )
  const resolved = createResolvedItemRuleIndex()
  const collectionIndexes = new Map<string, number>()
  for (const anchor of uniqueAnchors) {
    const propertyKey = anchor.rulePath.at(-1)
    if (propertyKey === undefined) continue
    const ownerRule = compiledRuleAtPath({
      rootRule,
      rulePath: anchor.rulePath.slice(0, -1),
      yamlPath: anchor.yamlPath,
      sourcePath: anchor.sourcePath,
      resolvedItemRules: resolved,
    })
    if (ownerRule === undefined) continue
    const planned = getYAMLToXMLPlan(ownerRule).properties.find(
      (candidate) => candidate.propertyKey === propertyKey,
    )
    if (planned === undefined) continue
    const nested = getTypeRule(planned.propertyRule.type, "yamlToXMLNestedRule")
    if (nested?.kind !== "collection") continue
    const collectionKey = JSON.stringify([
      anchor.sourcePath,
      anchor.rulePath,
      parentXmlPath(anchor.xmlPath),
    ])
    const index = collectionIndexes.get(collectionKey) ?? 0
    collectionIndexes.set(collectionKey, index + 1)
    const itemRule = resolveNestedItemRule({
      nested,
      propertyRule: planned.propertyRule,
      yaml: valueAtYamlPath(data, anchor.yamlPath),
      name: typeof anchor.yamlPath.at(-1) === "string"
        ? String(anchor.yamlPath.at(-1))
        : undefined,
      index,
    }) ?? nestedItemRule(planned.propertyRule.type)
    if (itemRule !== undefined) resolved.add({ ...anchor, rule: itemRule })
  }
  return resolved
}

function compiledRuleAtPath(params: {
  readonly rootRule: MetadataItemRule
  readonly rulePath: readonly string[]
  readonly yamlPath: readonly (string | number)[]
  readonly sourcePath: string
  readonly resolvedItemRules: ResolvedXmlAnomalyItemRuleIndex
}): MetadataItemRule | undefined {
  let rule: MetadataItemRule | undefined = params.rootRule
  for (let index = 0; index < params.rulePath.length && rule !== undefined; index += 1) {
    const plan = getYAMLToXMLPlan(rule)
    const planned: (typeof plan.properties)[number] | undefined = plan.properties.find(
      (candidate) => candidate.propertyKey === params.rulePath[index],
    )
    if (planned === undefined) return undefined
    rule = params.resolvedItemRules.find({
      sourcePath: params.sourcePath,
      rulePath: params.rulePath.slice(0, index + 1),
      yamlPath: params.yamlPath,
    })?.rule ?? nestedItemRule(planned.propertyRule.type)
  }
  return rule
}

function parentXmlPath(path: string): string {
  return path.slice(0, path.lastIndexOf("/"))
}

function createResolvedItemRuleIndex(): ResolvedXmlAnomalyItemRuleIndex {
  const exact = new Map<string, ResolvedXmlAnomalyItemRule>()
  return {
    add(candidate) {
      exact.set(itemRuleLookupKey(candidate.sourcePath, candidate.rulePath, candidate.yamlPath), candidate)
    },
    find(params) {
      if (params.exactYamlPath === true) {
        return exact.get(itemRuleLookupKey(params.sourcePath, params.rulePath, params.yamlPath))
      }
      for (let length = params.yamlPath.length; length >= 0; length -= 1) {
        const candidate = exact.get(itemRuleLookupKey(
          params.sourcePath,
          params.rulePath,
          params.yamlPath.slice(0, length),
        ))
        if (candidate !== undefined) return candidate
      }
      return undefined
    },
  }
}

function itemRuleLookupKey(
  sourcePath: string,
  rulePath: readonly string[],
  yamlPath: readonly (string | number)[],
): string {
  return JSON.stringify([sourcePath, rulePath, yamlPath])
}

function indexItemAnchors(anchors: readonly XmlAnomalyItemAnchor[]): XmlAnomalyItemAnchorIndex {
  const byParent = new Map<string, XmlAnomalyItemAnchor[]>()
  const byNormalizedPath = new Map<string, XmlAnomalyItemAnchor[]>()
  for (const anchor of anchors) {
    appendAnchorIndex(
      byParent,
      collectionAnchorLookupKey(anchor.sourcePath, anchor.rulePath, parentXmlPath(anchor.xmlPath)),
      anchor,
    )
    appendAnchorIndex(
      byNormalizedPath,
      collectionAnchorLookupKey(anchor.sourcePath, anchor.rulePath, normalizeElementOccurrences(anchor.xmlPath)),
      anchor,
    )
  }
  return { byParent, byNormalizedPath }
}

function appendAnchorIndex(
  index: Map<string, XmlAnomalyItemAnchor[]>,
  key: string,
  anchor: XmlAnomalyItemAnchor,
): void {
  const current = index.get(key)
  if (current === undefined) index.set(key, [anchor])
  else current.push(anchor)
}

function collectionItemAnchors(
  index: XmlAnomalyItemAnchorIndex,
  sourcePath: string,
  rulePath: readonly string[],
  xmlPath: string,
): readonly XmlAnomalyItemAnchor[] {
  const parentMatches = index.byParent.get(collectionAnchorLookupKey(sourcePath, rulePath, xmlPath)) ?? []
  const directMatches = index.byNormalizedPath.get(collectionAnchorLookupKey(
    sourcePath,
    rulePath,
    normalizeElementOccurrences(xmlPath),
  )) ?? []
  if (parentMatches.length === 0) return directMatches
  if (directMatches.length === 0) return parentMatches
  return [...new Map([...parentMatches, ...directMatches].map((anchor) => [anchor.xmlPath, anchor])).values()]
}

function collectionAnchorLookupKey(
  sourcePath: string,
  rulePath: readonly string[],
  xmlPath: string,
): string {
  return JSON.stringify([sourcePath, rulePath, xmlPath])
}

function normalizeElementOccurrences(path: string): string {
  return path.replace(/\[\d+\]/gu, "[1]")
}

function compiledProofLevels(
  rootRule: MetadataItemRule,
  rulePath: readonly string[],
  yamlPath: readonly (string | number)[],
  sourcePath: string,
  resolvedItemRules: ResolvedXmlAnomalyItemRuleIndex,
): readonly {
  readonly yamlPath: readonly (string | number)[]
  readonly rawYamlPath: readonly (string | number)[]
  readonly protectedYamlPaths: readonly (readonly (string | number)[])[]
}[] {
  let rule: MetadataItemRule | undefined = rootRule
  const rootToLeaf: {
    readonly yamlPath: readonly (string | number)[]
    readonly rawYamlPath: readonly (string | number)[]
    readonly protectedYamlPaths: readonly (readonly (string | number)[])[]
  }[] = []
  for (let index = 0; index < rulePath.length && rule !== undefined; index += 1) {
    const propertyKey = rulePath[index]!
    const plan = getYAMLToXMLPlan(rule)
    const planned = plan.properties.find((candidate) => candidate.propertyKey === propertyKey)
    if (planned === undefined) break
    const remainingProperties = rulePath.length - index - 1
    const propertyYamlPath = yamlPath.slice(0, Math.max(1, yamlPath.length - remainingProperties))
    const ownerPath = propertyYamlPath.slice(0, -1)
    for (let segment = 0; segment < planned.xmlPath.length; segment += 1) {
      const xmlPrefix = planned.xmlPath.slice(0, segment + 1)
      const isPropertyLeaf = segment === planned.xmlPath.length - 1
      // Для запрета подъёма достаточно одного независимого соседа. Хранение
      // полного списка для каждой XML-границы квадратично раздувало подробный
      // аудит больших форм, хотя список использовался только как признак.
      const protectedProperty = plan.properties.find(
        (candidate) => candidate.propertyKey !== propertyKey && startsWithStringPath(candidate.xmlPath, xmlPrefix),
      )
      const protectedYamlPaths = protectedProperty === undefined
        ? []
        : [[...ownerPath, protectedProperty.yamlKey ?? protectedProperty.propertyKey]]
      rootToLeaf.push({
        yamlPath: propertyYamlPath,
        rawYamlPath: isPropertyLeaf
          ? propertyYamlPath
          : [...ownerPath, xmlPrefix.join("\\")],
        protectedYamlPaths,
      })
    }
    rule = resolvedItemRules.find({
      sourcePath,
      rulePath: rulePath.slice(0, index + 1),
      yamlPath,
    })?.rule ?? nestedItemRule(planned.propertyRule.type)
  }
  return rootToLeaf.length === 0
    ? [{ yamlPath, rawYamlPath: yamlPath, protectedYamlPaths: [] }]
    : rootToLeaf.reverse()
}

function startsWithStringPath(path: readonly string[], prefix: readonly string[]): boolean {
  return prefix.length <= path.length && prefix.every((segment, index) => path[index] === segment)
}

function appendPlannedAbsenceBoundaries(params: {
  readonly sources: readonly XmlAnomalyProofSource[]
  readonly elementsBySourcePath: ReadonlyMap<string, ReadonlyMap<string, XmlElementNode>>
  readonly boundaries: XmlAnomalyProofBoundary[]
  readonly existingYamlPaths: Set<string>
  readonly existingXmlPaths: Set<string>
  readonly source: XmlAnomalyProofSource
  readonly root: XmlElementNode
  readonly rule: MetadataItemRule
  readonly yamlPrefix: readonly (string | number)[]
  readonly rulePrefix: readonly string[]
  readonly itemAnchors: readonly XmlAnomalyItemAnchor[]
  readonly itemAnchorIndex: XmlAnomalyItemAnchorIndex
  readonly resolvedItemRules: ResolvedXmlAnomalyItemRuleIndex
  readonly data: unknown
}): void {
  const elements = params.elementsBySourcePath.get(params.source.sourcePath)
  for (const planned of getYAMLToXMLPlan(params.rule).properties) {
    const yamlKey = planned.yamlKey ?? planned.propertyKey
    const yamlPath = [...params.yamlPrefix, yamlKey]
    const rulePath = [...params.rulePrefix, planned.propertyKey]
    if (planned.propertyRule.filePath !== undefined) {
      const externalSource = matchPlannedSource(params.sources, planned.propertyRule.filePath)
      const externalRoot = externalSource?.document.roots[0]
      const nested = nestedItemRule(planned.propertyRule.type)
      if (externalSource !== undefined && externalRoot !== undefined && nested !== undefined) {
        appendPlannedAbsenceBoundaries({
          ...params,
          source: externalSource,
          root: externalRoot,
          rule: nested,
          yamlPrefix: yamlPath,
          rulePrefix: rulePath,
        })
      }
      continue
    }
    if (planned.xmlPath.at(-1)?.startsWith("_") === true) continue
    const xmlPath = appendElementPath(params.root.path, planned.xmlPath)
    const element = elements?.get(xmlPath)
    const nestedConversion = getTypeRule(planned.propertyRule.type, "yamlToXMLNestedRule")
    if (element !== undefined && nestedConversion?.kind === "collection") {
      const anchors = collectionItemAnchors(
        params.itemAnchorIndex,
        params.source.sourcePath,
        rulePath,
        xmlPath,
      )
      for (const anchor of anchors) {
        const itemRoot = elements?.get(anchor.xmlPath)
        if (itemRoot === undefined) continue
        const itemRule = params.resolvedItemRules.find({
          sourcePath: anchor.sourcePath,
          rulePath: anchor.rulePath,
          yamlPath: anchor.yamlPath,
          exactYamlPath: true,
        })?.rule ?? nestedItemRule(planned.propertyRule.type)
        if (itemRule === undefined) continue
        appendPlannedAbsenceBoundaries({
          ...params,
          root: itemRoot,
          rule: itemRule,
          yamlPrefix: anchor.yamlPath,
          rulePrefix: rulePath,
        })
      }
      continue
    }
    if (element !== undefined) {
      const nested = resolveNestedItemRule({
        nested: nestedConversion,
        propertyRule: planned.propertyRule,
        yaml: valueAtYamlPath(params.data, yamlPath),
        name: typeof yamlKey === "string" ? yamlKey : undefined,
        index: 0,
      }) ?? nestedItemRule(planned.propertyRule.type)
      if (nested !== undefined) {
        appendPlannedAbsenceBoundaries({
          ...params,
          root: element,
          rule: nested,
          yamlPrefix: yamlPath,
          rulePrefix: rulePath,
        })
      }
      continue
    }
    const yamlBoundaryKey = JSON.stringify([params.source.sourcePath, yamlPath])
    const xmlBoundaryKey = JSON.stringify([params.source.sourcePath, xmlPath])
    if (
      params.existingYamlPaths.has(yamlBoundaryKey)
      || params.existingXmlPaths.has(xmlBoundaryKey)
    ) continue
    params.existingYamlPaths.add(yamlBoundaryKey)
    params.existingXmlPaths.add(xmlBoundaryKey)
    params.boundaries.push({
      sourcePath: params.source.sourcePath,
      sourceRole: params.source.role,
      xmlPath,
      yamlPath,
      rulePath,
      presentInSource: false,
    })
  }
}

function resolveNestedItemRule(params: {
  readonly nested: YAMLToXMLNestedRule | undefined
  readonly propertyRule: PropertyRule
  readonly yaml: unknown
  readonly name: string | undefined
  readonly index: number
}): MetadataItemRule | undefined {
  if (params.nested === undefined) return undefined
  if (params.nested.kind === "collection") {
    return params.nested.resolveItemRule?.({
      yaml: params.yaml,
      name: params.name,
      index: params.index,
      propertyRule: params.propertyRule,
    }) ?? params.nested.itemRuleFromProperty?.(params.propertyRule) ?? params.nested.itemRule
  }
  if (params.nested.kind === "item") {
    return params.nested.itemRuleFromProperty?.(params.propertyRule) ?? params.nested.itemRule
  }
  if (params.nested.kind === "externalFile") return undefined
  if (!isStringRecord(params.yaml)) return undefined
  return params.nested.resolveItemRule({ yaml: params.yaml, name: params.name ?? "" })
}

function valueAtYamlPath(data: unknown, path: readonly (string | number)[]): unknown {
  let value = data
  for (const segment of path) {
    if (!isObject(value)) return undefined
    value = value[segment]
  }
  return value
}

function nestedItemRule(propertyType: Parameters<typeof getTypeRule>[0]): MetadataItemRule | undefined {
  const nested = getTypeRule(propertyType, "nestedItemRule")
  return nested !== undefined && "itemRule" in nested ? nested.itemRule : undefined
}

function matchPlannedSource(
  sources: readonly XmlAnomalyProofSource[],
  filePath: string,
): XmlAnomalyProofSource | undefined {
  const normalized = filePath.replaceAll("\\", "/")
  const candidates = sources.filter(({ role }) => role !== "metadata")
  const matches = candidates.filter(({ sourcePath }) => {
    const normalizedSource = sourcePath.replaceAll("\\", "/")
    return normalizedSource === normalized || normalizedSource.endsWith(`/${normalized}`)
  })
  return matches.length === 1 ? matches[0] : undefined
}

function proofBoundariesForOutcome(
  outcome: ReturnType<XmlImportAuditSession["outcomes"]>[number],
): readonly NonNullable<ReturnType<XmlImportAuditSession["outcomes"]>[number]["boundaries"][number]>[] {
  const boundaries = outcome.boundaries.filter(({ propertyKey, yamlPath }) =>
    propertyKey !== undefined && yamlPath !== undefined && yamlPath.length > 0
  )
  if (outcome.state !== "ambiguous") return boundaries
  if (!boundaries.every((left) => boundaries.every((right) =>
    startsWith(left.yamlPath!, right.yamlPath!) || startsWith(right.yamlPath!, left.yamlPath!)
  ))) return []
  const maxDepth = Math.max(...boundaries.map(({ yamlPath }) => yamlPath!.length))
  return boundaries.filter(({ yamlPath }) => yamlPath!.length === maxDepth)
}

function proofAuditState(
  state: XmlImportAuditOutcome["state"],
): XmlAnomalyProofBoundary["auditState"] {
  if (
    state === "semanticallyElided"
    || state === "externallyPersisted"
    || state === "structurallyClaimed"
  ) return state
  return undefined
}

export function captureXmlAnomalyProofAudit(params: {
  readonly sources: readonly XmlAnomalyProofSource[]
  readonly boundaries: readonly XmlAnomalyProofBoundary[]
  readonly fallbackBoundaries?: readonly XmlAnomalyProofBoundary[]
  readonly itemAnchors?: readonly XmlAnomalyItemAnchor[]
}): XmlAnomalyProofAudit {
  const sourceByPath = new Map(params.sources.map((source) => [source.sourcePath, source] as const))
  const allBoundaries = [...params.boundaries, ...(params.fallbackBoundaries ?? [])]
  const needsIndex = allBoundaries.some((boundary) =>
    boundary.presentInSource && (boundary.levels === undefined || boundary.capturedTargets === undefined)
  )
  const indexesBySourcePath = needsIndex
    ? new Map(params.sources.map((source) => [source.sourcePath, indexXmlDocument(source.document.roots)] as const))
    : new Map<string, ReturnType<typeof indexXmlDocument>>()
  const captureBoundary = (boundary: XmlAnomalyProofBoundary): XmlAnomalyProofAuditBoundary => {
    const { capturedTargets, ...publicBoundary } = boundary
    const source = sourceByPath.get(boundary.sourcePath)
    if (source === undefined) throw new Error(`Не найден XML-source для proof: ${boundary.sourcePath}`)
    if (!boundary.presentInSource) {
      return { ...publicBoundary, targets: [], levels: [] }
    }
    if (boundary.levels !== undefined && capturedTargets !== undefined) {
      return {
        ...publicBoundary,
        targets: capturedTargets.map((target) => ({
          ...target,
          span: { ...target.span },
        })),
        levels: boundary.levels.map((level) => ({
          ...level,
          yamlPath: [...level.yamlPath],
          ...(level.rawYamlPath === undefined ? {} : { rawYamlPath: [...level.rawYamlPath] }),
          ...(level.protectedYamlPaths === undefined
            ? {}
            : { protectedYamlPaths: level.protectedYamlPaths.map((path) => [...path]) }),
          span: { ...level.span },
        })),
      }
    }
    const { elements, nodes } = indexesBySourcePath.get(boundary.sourcePath)!
    const node = elements.get(boundary.xmlPath)
    if (node === undefined) {
      throw new Error(`Не найдена XML-граница proof ${boundary.xmlPath} в ${boundary.sourcePath}`)
    }
    const ancestry = elementAncestry(elements, node.path).slice(
      0,
      Math.max(1, boundary.yamlPath.length),
    )
    const levels = boundary.levels ?? ancestry.map((element, index): XmlAnomalyProofLevel => ({
      xmlPath: element.path,
      yamlPath: boundary.yamlPath.slice(0, Math.max(0, boundary.yamlPath.length - index)),
      rawYamlPath: boundary.yamlPath.slice(0, Math.max(0, boundary.yamlPath.length - index)),
      elementName: element.name,
      structuralHash: element.structuralHash,
      span: { ...element.span },
    }))
    const targetPaths = boundary.targetPaths
      ?? (boundary.levels === undefined ? [boundary.xmlPath] : [boundary.levels[0]!.xmlPath])
    const targets = targetPaths.map((path) => {
      if (boundary.levels !== undefined && path === boundary.levels[0]?.xmlPath) {
        return {
          path,
          signature: boundary.levels[0].structuralHash,
          span: { ...boundary.levels[0].span },
        }
      }
      const target = nodes.get(path)
      if (target === undefined) throw new Error(`Не найдена XML-цель proof ${path} в ${boundary.sourcePath}`)
      return { path, signature: nodeSignature(target), span: { ...target.span } }
    })
    return { ...publicBoundary, targets, levels }
  }
  const boundaries = params.boundaries.map(captureBoundary)
  const fallbackBoundaries = (params.fallbackBoundaries ?? []).map(captureBoundary)
  const itemAnchors = (params.itemAnchors ?? []).map((anchor) => ({
    ...anchor,
    yamlPath: [...anchor.yamlPath],
    rulePath: [...anchor.rulePath],
  }))
  return {
    sources: params.sources.map(({ sourcePath, role, document }) => ({
      sourcePath,
      role,
      roots: document.roots.map((root) => ({
        xmlPath: root.path,
        elementName: root.name,
        structuralHash: root.structuralHash,
        span: { ...root.span },
      })),
    })),
    boundaries,
    ...(fallbackBoundaries.length === 0 ? {} : { fallbackBoundaries }),
    itemAnchors,
  }
}

export function createXmlAnomalyProofAddressIndex(
  audit: Pick<XmlAnomalyProofAudit, "boundaries" | "itemAnchors">,
): XmlRuleAddressIndex {
  return createXmlRuleAddressIndex(proofRuleAddresses(
    audit.boundaries,
    audit.itemAnchors ?? [],
  ))
}

function proofRuleAddresses(
  boundaries: readonly XmlAnomalyProofAuditBoundary[],
  itemAnchors: readonly XmlAnomalyItemAnchor[],
): readonly XmlRuleAddress[] {
  const addresses: XmlRuleAddress[] = []
  for (const boundary of boundaries) {
    for (const target of boundary.targets) {
      addresses.push({
        sourcePath: boundary.sourcePath,
        xmlPath: target.path,
        yamlPath: [...boundary.yamlPath],
        rulePath: boundary.rulePath.map((propertyKey) => ({ propertyKey })),
        kind: "property",
      })
    }
    const levels = boundary.levels.length === 0
      ? [{
          xmlPath: boundary.xmlPath,
          yamlPath: boundary.yamlPath,
          rawYamlPath: boundary.yamlPath,
        }]
      : boundary.levels
    for (const level of levels) {
      addresses.push({
        sourcePath: boundary.sourcePath,
        xmlPath: level.xmlPath,
        yamlPath: [...(level.rawYamlPath ?? level.yamlPath)],
        rulePath: boundary.rulePath.map((propertyKey) => ({ propertyKey })),
        kind: "property",
      })
    }
  }
  for (const anchor of itemAnchors) {
    addresses.push({
      sourcePath: anchor.sourcePath,
      xmlPath: anchor.xmlPath,
      yamlPath: [...anchor.yamlPath],
      rulePath: anchor.rulePath.map((propertyKey) => ({ propertyKey })),
      kind: "item",
    })
  }
  return [...new Map(addresses.map((address) => [JSON.stringify(address), address])).values()]
}

export interface ProveXmlAnomalyBoundariesResult {
  readonly data: unknown
  readonly annotations: XmlAnomalyAnnotationsSnapshot
  readonly rereadSourcePaths: readonly string[]
  readonly warnings: readonly XmlRawScopeWarning[]
}

export interface XmlRawScopeWarning {
  readonly sourcePath: string
  readonly xmlPath: string
  readonly yamlPath: readonly (string | number)[]
  readonly nearestYamlPath?: readonly (string | number)[]
  readonly reason: UnlocalizedXmlDifferenceReason
  readonly rawBytes: number
}

export async function proveXmlAnomalyBoundaries(params: {
  readonly data: unknown
  readonly annotations: XmlAnomalyAnnotationsSnapshot
  readonly audit: XmlAnomalyProofAudit
  readonly rule?: MetadataItemRule
  readonly exported: readonly {
    readonly role: ImportXmlInput["role"]
    readonly sourcePath?: string
    readonly document: XmlDocument
  }[]
  readonly readSource: (sourcePath: string) => Promise<string>
}): Promise<ProveXmlAnomalyBoundariesResult> {
  let data = params.data
  let ownsData = false
  const mutableData = (): unknown => {
    if (!ownsData) {
      data = cloneYamlForProof(data)
      ownsData = true
    }
    return data
  }
  let annotationSnapshot = cloneAnnotationSnapshot(params.annotations)
  let annotationIndex = createProofAnnotationIndex(annotationSnapshot)
  const rereadDocuments = new Map<string, XmlDocument>()
  const rereadElements = new Map<string, ReadonlyMap<string, XmlElementNode>>()
  const rereadNodes = new Map<string, ReadonlyMap<string, XmlImportAuditedNode>>()
  const exportedElements = new Map(
    params.exported.map(({ document }) => [document, indexXmlDocument(document.roots).nodes] as const),
  )
  const rereadSourcePaths: string[] = []
  const transformations: XmlProofTransformation[] = []
  const insertedRawXmlPaths = new Set<string>()
  const unlocalizedBySource = new Map<string, UnlocalizedXmlDifference[]>()
  const warnings: XmlRawScopeWarning[] = []
  const verificationSourcePaths = new Set(
    (params.audit.fallbackBoundaries ?? []).map(({ sourcePath }) => sourcePath),
  )

  const readDocument = async (sourcePath: string): Promise<XmlDocument> => {
    const cached = rereadDocuments.get(sourcePath)
    if (cached !== undefined) return cached
    const content = await params.readSource(sourcePath)
    const document = parseXmlDocumentWithSaxes(content, {
      preserveXsiNil: true,
      preserveEmptyElements: true,
    })
    rereadDocuments.set(sourcePath, document)
    const index = indexXmlDocument(document.roots)
    rereadElements.set(sourcePath, index.elements)
    rereadNodes.set(sourcePath, index.nodes)
    rereadSourcePaths.push(sourcePath)
    return document
  }

  const changedSourcePaths = new Set<string>()
  for (const source of params.audit.sources) {
    const exported = exportedDocumentForSource(params.exported, source)
    if (exported !== undefined && !sourceRootsAreExact(source.roots, exported)) {
      changedSourcePaths.add(source.sourcePath)
    }
  }

  const boundaries: XmlAnomalyProofBoundary[] = [...params.audit.boundaries]
  if (params.rule !== undefined) {
    if (changedSourcePaths.size > 0) {
      const sources: XmlAnomalyProofSource[] = []
      for (const source of params.audit.sources) {
        sources.push({
          sourcePath: source.sourcePath,
          role: source.role,
          document: await readDocument(source.sourcePath),
        })
      }
      const plannedAbsences = deriveXmlAnomalyPlannedAbsenceBoundaries({
        sources,
        rule: params.rule,
        data,
        itemAnchors: params.audit.itemAnchors ?? [],
        existingBoundaries: boundaries,
      }).filter(({ sourcePath }) => changedSourcePaths.has(sourcePath))
      boundaries.push(...plannedAbsences)
    }
  }
  const addressIndex = createXmlAnomalyProofAddressIndex(params.audit)
  for (const source of params.audit.sources) {
    if (!changedSourcePaths.has(source.sourcePath)) continue
    const hasFallbackBoundary = (params.audit.fallbackBoundaries ?? []).some(
      (boundary) => boundary.sourcePath === source.sourcePath,
    )
    const hasKnownBoundary = boundaries.some(
      (boundary) => boundary.sourcePath === source.sourcePath,
    )
    if (!hasFallbackBoundary && hasKnownBoundary) continue
    const exported = exportedDocumentForSource(params.exported, source)
    if (exported === undefined) continue
    const sourceDocument = await readDocument(source.sourcePath)
    const residualDifferences = compareXmlStructureDifferences(
      sourceDocument.roots,
      exported.roots,
    ).filter((difference) =>
      difference.kind !== "order"
      && !boundaries.some((boundary) =>
        boundary.sourcePath === source.sourcePath
        && proofBoundaryCoversDifference(boundary, difference)
      )
    )
    const localized = localizeXmlDifferences({
      sourcePath: source.sourcePath,
      differences: residualDifferences,
      addressIndex,
    })
    const sourceNodes = rereadNodes.get(source.sourcePath)!
    const sourceElements = rereadElements.get(source.sourcePath)!
    for (const difference of localized.localized) {
      const boundary = localizedDifferenceBoundary({
        source,
        localized: difference,
        sourceNodes,
        sourceElements,
      })
      if (boundary !== undefined) {
        boundaries.push(boundary)
        continue
      }
      appendUnlocalizedDifference(unlocalizedBySource, source.sourcePath, {
        difference: difference.difference,
        nearestAddresses: [difference.address],
        reason: "unresolved-export-claim",
      })
    }
    for (const difference of localized.unlocalized) {
      appendUnlocalizedDifference(unlocalizedBySource, source.sourcePath, difference)
    }
  }
  const resolvedItemRules = params.rule === undefined
    ? undefined
    : resolveDynamicItemRules(params.rule, params.audit.itemAnchors ?? [], data)
  for (const boundary of boundaries) {
    const exported = singleExportedDocument(params.exported, boundary)
    if (exported === undefined) continue
    const exportedNodes = exportedElements.get(exported)
    const acceptedSourceAbsence = isAcceptedSourceAbsence(boundary, exportedNodes)
    const exact = boundary.presentInSource
      ? acceptedSourceAbsence
        || (isCapturedProofBoundary(boundary) && boundary.targets.length > 0 && boundary.targets.every((target) =>
          targetSignature(exportedNodes?.get(target.path), target.signature) === target.signature
        ))
      : exportedNodes?.get(boundary.xmlPath) === undefined
    if (exact) {
      if (acceptedSourceAbsence && verificationSourcePaths.has(boundary.sourcePath)) {
        transformations.push({
          sourcePath: boundary.sourcePath,
          side: "source",
          xmlPath: boundary.xmlPath,
          value: null,
          hasSemanticValue: false,
        })
      }
      continue
    }
    if (hasRawForBoundary(annotationIndex, boundary)) {
      if (!verificationSourcePaths.has(boundary.sourcePath)) continue
      if (boundary.presentInSource) {
        await readDocument(boundary.sourcePath)
        const source = rereadElements.get(boundary.sourcePath)!.get(boundary.xmlPath)
        if (source === undefined) throw new Error(`Не найдена XML-граница ${boundary.xmlPath}`)
        transformations.push({
          sourcePath: boundary.sourcePath,
          side: "exported",
          xmlPath: boundary.xmlPath,
          value: xmlElementRawValue(source),
          hasSemanticValue: false,
        })
      } else {
        transformations.push({
          sourcePath: boundary.sourcePath,
          side: "exported",
          xmlPath: boundary.xmlPath,
          value: null,
          hasSemanticValue: false,
        })
      }
      continue
    }

    if (!boundary.presentInSource) {
      const rawYamlPath = publicRawYamlPath(boundary.yamlPath, boundary, false)
      setRawYamlValue(mutableData(), rawYamlPath, undefined, boundary.yamlPath)
      annotationSnapshot = withRawAnnotation(
        annotationSnapshot,
        rawYamlPath,
        null,
        false,
        boundary.yamlPath,
      )
      annotationIndex = createProofAnnotationIndex(annotationSnapshot)
      if (verificationSourcePaths.has(boundary.sourcePath)) {
        transformations.push({
          sourcePath: boundary.sourcePath,
          side: "exported",
          xmlPath: boundary.xmlPath,
          value: null,
          hasSemanticValue: false,
        })
      }
      continue
    }

    await readDocument(boundary.sourcePath)
    if (!isCapturedProofBoundary(boundary)) {
      throw new Error(`У присутствующей XML-границы ${boundary.xmlPath} отсутствуют proof-данные`)
    }
    const sourceElements = rereadElements.get(boundary.sourcePath)!
    const sourceNodes = rereadNodes.get(boundary.sourcePath)!
    const firstSource = sourceElements.get(boundary.xmlPath)
    if (
      firstSource === undefined
      || boundary.targets.some((target) => targetSignature(sourceNodes.get(target.path), target.signature) !== target.signature)
    ) {
      throw new Error(`Исходный XML изменился после первого прохода: ${boundary.sourcePath} ${boundary.xmlPath}`)
    }
    const selected = await selectXmlAnomalyRawLevel({
      boundary,
      annotations: annotationSnapshot,
      verify: async (level) => {
        const source = sourceElements.get(level.xmlPath)
        if (source === undefined || source.structuralHash !== level.structuralHash) return false
        if (!hasUniqueXmlAddressFromItemAnchor({
          boundary,
          level,
          itemAnchors: params.audit.itemAnchors ?? [],
          elements: sourceElements,
        })) return false
        try {
          const raw = xmlElementRawValue(source)
          const decoded = decodeXmlRawValue(raw, { elementName: source.name }).nodes[0]
          if (decoded === undefined || decoded.structuralHash !== source.structuralHash) return false
          const levelIndex = boundary.levels.findIndex(({ xmlPath }) => xmlPath === level.xmlPath)
          const comparison = boundary.levels[levelIndex + 1] ?? level
          const sourceComparison = sourceElements.get(comparison.xmlPath)
          if (sourceComparison === undefined) return false
          if (comparison !== level) {
            const exportedComparison = xmlElementAtPath(exportedNodes, comparison.xmlPath)
            return exportedComparison !== undefined
              && sameElementShell(exportedComparison, sourceComparison)
          }
          const parentPath = parentElementPath(level.xmlPath)
          if (parentPath === undefined) return true
          const exportedParent = xmlElementAtPath(exportedNodes, parentPath)
          const sourceParent = sourceElements.get(parentPath)
          return exportedParent !== undefined
            && sourceParent !== undefined
            && sameElementShell(exportedParent, sourceParent)
        } catch {
          return false
        }
      },
    })
    const selectedSource = sourceElements.get(selected.xmlPath)
    if (selectedSource === undefined) throw new Error(`Не найдена выбранная XML-граница ${selected.xmlPath}`)
    const localRawYamlPath = selected.rawYamlPath ?? selected.yamlPath
    const hasSemanticValue = sameYamlPath(localRawYamlPath, selected.yamlPath)
      && valueAtYamlPath(data, selected.yamlPath) !== undefined
    const rawYamlPath = publicRawYamlPath(localRawYamlPath, boundary, hasSemanticValue)
    assertRawYamlPathAvailable(data, annotationSnapshot, rawYamlPath, selected.yamlPath)
    const exportedSelectedNode = exportedElements.get(exported)?.get(selected.xmlPath)
    const exportedSelected = exportedSelectedNode !== undefined
      && "type" in exportedSelectedNode
      && exportedSelectedNode.type === "element"
      ? exportedSelectedNode
      : undefined
    const xml = hasSemanticValue && exportedSelected !== undefined
      ? createXmlElementPatch(selectedSource, exportedSelected)
      : xmlElementRawValue(selectedSource)
    if (exportedSelected === undefined && xml !== null) {
      insertedRawXmlPaths.add(JSON.stringify([boundary.sourcePath, selected.xmlPath]))
    }
    if (verificationSourcePaths.has(boundary.sourcePath)) {
      transformations.push({
        sourcePath: boundary.sourcePath,
        side: "exported",
        xmlPath: selected.xmlPath,
        value: xml,
        hasSemanticValue,
      })
    }
    if (!hasSemanticValue) {
      setRawYamlValue(mutableData(), rawYamlPath, undefined, selected.yamlPath)
    }
    annotationSnapshot = withRawAnnotation(
      annotationSnapshot,
      rawYamlPath,
      xml,
      hasSemanticValue,
      selected.yamlPath,
    )
    annotationIndex = createProofAnnotationIndex(annotationSnapshot)
  }

  for (const source of params.audit.sources) {
    const exported = exportedDocumentForSource(params.exported, source)
    if (exported === undefined || sourceRootsAreExact(source.roots, exported)) continue
    const exportedNodes = exportedElements.get(exported)
    const sourceBoundaries = boundaries.filter((boundary) => boundary.sourcePath === source.sourcePath)
    const boundariesByContainerPath = new Map<string, XmlAnomalyProofBoundary[]>()
    for (const boundary of sourceBoundaries) {
      if (isAcceptedSourceAbsence(boundary, exportedNodes)) continue
      for (const { xmlPath } of boundary.levels ?? []) {
        const related = boundariesByContainerPath.get(xmlPath)
        if (related === undefined) boundariesByContainerPath.set(xmlPath, [boundary])
        else related.push(boundary)
      }
    }
    for (const [xmlPath, related] of boundariesByContainerPath) {
      const orderPath = orderRawYamlPath(related, xmlPath)
      if (orderPath === undefined) continue
      const localRawYamlPath = containerRawYamlPath(orderPath) ?? orderPath
      const rawYamlPath = publicRawYamlPath(localRawYamlPath, related[0]!, false)
      if (hasRawAtOrAbovePath(annotationIndex, rawYamlPath)) continue
      await readDocument(source.sourcePath)
      const sourceElement = rereadElements.get(source.sourcePath)!.get(xmlPath)
      const exportedNode = exportedNodes?.get(xmlPath)
      const exportedElement = exportedNode !== undefined
        && "type" in exportedNode
        && exportedNode.type === "element"
        ? exportedNode
        : undefined
      if (sourceElement === undefined || exportedElement === undefined) continue
      const sourceOrder = directElementOrder(sourceElement)
      const exportedOrder = directElementOrder(exportedElement)
      if (sourceOrder.length <= 1) continue
      if (sameStrings(sourceOrder, exportedOrder)) continue
      const insertsRawChild = related.some((boundary) =>
        (boundary.levels ?? []).some((level) =>
          parentElementPath(level.xmlPath) === xmlPath
          && insertedRawXmlPaths.has(JSON.stringify([source.sourcePath, level.xmlPath]))
        )
      )
      if (!sameStringMultiset(sourceOrder, exportedOrder) && !insertsRawChild) continue
      const canonicalOrder = params.rule === undefined || resolvedItemRules === undefined
        ? undefined
        : canonicalDirectElementOrder({
            rootRule: params.rule,
            resolvedItemRules,
            itemAnchors: params.audit.itemAnchors ?? [],
            sourcePath: source.sourcePath,
            sourceRootPaths: source.roots.map(({ xmlPath: rootPath }) => rootPath),
            xmlPath,
          })
      if (
        insertsRawChild
        && canonicalOrder !== undefined
        && followsCanonicalDirectElementOrder(sourceOrder, canonicalOrder)
      ) {
        if (verificationSourcePaths.has(source.sourcePath)) {
          transformations.push({
            sourcePath: source.sourcePath,
            side: "exported",
            xmlPath,
            value: directContentOrderPatch(sourceElement),
            hasSemanticValue: true,
          })
        }
        continue
      }
      assertRawYamlPathAvailable(data, annotationSnapshot, rawYamlPath, rawYamlPath)
      setRawYamlValue(mutableData(), rawYamlPath, undefined)
      const orderXml = insertsRawChild ? directContentOrderPatch(sourceElement) : { "#order": sourceOrder }
      annotationSnapshot = withRawAnnotation(
        annotationSnapshot,
        rawYamlPath,
        orderXml,
        false,
      )
      annotationIndex = createProofAnnotationIndex(annotationSnapshot)
      if (verificationSourcePaths.has(source.sourcePath)) {
        transformations.push({
          sourcePath: source.sourcePath,
          side: "exported",
          xmlPath,
          value: insertsRawChild ? orderXml : sourceOrder,
          hasSemanticValue: true,
          ...(insertsRawChild ? {} : { terminal: "order" }),
        })
      }
    }
  }

  for (const source of params.audit.sources) {
    if (!changedSourcePaths.has(source.sourcePath)) continue
    const exported = exportedDocumentForSource(params.exported, source)
    if (exported === undefined) continue
    const fallbacks = (params.audit.fallbackBoundaries ?? []).filter(
      (boundary) => boundary.sourcePath === source.sourcePath,
    )
    if (fallbacks.length > 1) {
      throw new Error(`XML-документу ${source.sourcePath} соответствует несколько резервных proof-границ`)
    }
    if (fallbacks.length === 0) {
      const sourceBoundaries = boundaries.filter((boundary) => boundary.sourcePath === source.sourcePath)
      const hasCapturedBoundary = sourceBoundaries.some(
        (boundary) => boundary.presentInSource && isCapturedProofBoundary(boundary),
      )
      const hasHandledBoundary = sourceBoundaries.some((boundary) =>
        hasRawForBoundary(annotationIndex, boundary)
      )
      if (hasCapturedBoundary || hasHandledBoundary) continue
    }

    const sourceDocument = await readDocument(source.sourcePath)
    if (fallbacks.length > 0 && transformedXmlRootsAreExact({
      sourcePath: source.sourcePath,
      source: sourceDocument,
      exported,
      transformations,
    })) continue

    const fallback = fallbacks[0]
    if (fallback !== undefined) {
      const sourceRoot = sourceDocument.roots.find((root) => root.path === fallback.xmlPath)
      const exportedRoot = exported.roots.find((root) => root.path === fallback.xmlPath)
      if (sourceRoot === undefined || exportedRoot === undefined) {
        throw new Error(`Не найдена корневая резервная XML-граница ${fallback.xmlPath}`)
      }
      const hasSemanticValue = valueAtYamlPath(data, fallback.yamlPath) !== undefined
      const rawYamlPath = publicRawYamlPath(fallback.yamlPath, fallback, hasSemanticValue)
      if (hasRawAtOrAbovePath(annotationIndex, rawYamlPath)) continue
      assertRawYamlPathAvailable(data, annotationSnapshot, rawYamlPath, fallback.yamlPath)
      if (!hasSemanticValue) setRawYamlValue(mutableData(), rawYamlPath, undefined, fallback.yamlPath)
      const fallbackXml = sourceRoot.name === exportedRoot.name && hasSemanticValue
        ? createXmlElementPatch(sourceRoot, exportedRoot)
        : xmlElementRawValue(sourceRoot)
      annotationSnapshot = withRawAnnotation(
        annotationSnapshot,
        rawYamlPath,
        fallbackXml,
        hasSemanticValue,
        fallback.yamlPath,
      )
      annotationIndex = createProofAnnotationIndex(annotationSnapshot)
      warnings.push(rawScopeWarning({
        sourcePath: source.sourcePath,
        yamlPath: rawYamlPath,
        fallbackXml,
        unresolved: unlocalizedBySource.get(source.sourcePath)?.[0],
        fallbackXmlPath: fallback.xmlPath,
      }))
      continue
    }

    if (sourceDocument.roots.length !== 1 || exported.roots.length !== 1) {
      throw new Error(
        `Нелокализованное XML-расхождение требует по одному корню: ${source.sourcePath}`,
      )
    }
    const sourceRoot = sourceDocument.roots[0]!
    const exportedRoot = exported.roots[0]!
    const rawYamlPath = [source.role === "metadata" ? "@" : `@${xmlDocumentShortName(source.sourcePath)}`]
    assertRawYamlPathAvailable(data, annotationSnapshot, rawYamlPath, rawYamlPath)
    setRawYamlValue(mutableData(), rawYamlPath, undefined)
    const fallbackXml = sourceRoot.name === exportedRoot.name
      ? createXmlElementPatch(sourceRoot, exportedRoot)
      : xmlElementRawValue(sourceRoot)
    annotationSnapshot = withRawAnnotation(
      annotationSnapshot,
      rawYamlPath,
      fallbackXml,
      false,
    )
    annotationIndex = createProofAnnotationIndex(annotationSnapshot)
    warnings.push(rawScopeWarning({
      sourcePath: source.sourcePath,
      yamlPath: rawYamlPath,
      fallbackXml,
      unresolved: unlocalizedBySource.get(source.sourcePath)?.[0],
      fallbackXmlPath: sourceRoot.path,
    }))
  }

  const annotations = restoreXmlAnomalyAnnotations(data, annotationSnapshot)
  return {
    data,
    annotations: snapshotXmlAnomalyAnnotations(data, annotations),
    rereadSourcePaths,
    warnings,
  }
}

function appendUnlocalizedDifference(
  bySource: Map<string, UnlocalizedXmlDifference[]>,
  sourcePath: string,
  difference: UnlocalizedXmlDifference,
): void {
  const current = bySource.get(sourcePath)
  if (current === undefined) bySource.set(sourcePath, [difference])
  else current.push(difference)
}

function rawScopeWarning(params: {
  readonly sourcePath: string
  readonly yamlPath: readonly (string | number)[]
  readonly fallbackXml: XmlRawValue
  readonly unresolved: UnlocalizedXmlDifference | undefined
  readonly fallbackXmlPath: string
}): XmlRawScopeWarning {
  const nearestYamlPath = params.unresolved?.nearestAddresses.length === 1
    ? params.unresolved.nearestAddresses[0]!.yamlPath
    : undefined
  return {
    sourcePath: params.sourcePath,
    xmlPath: params.unresolved?.difference.path ?? params.fallbackXmlPath,
    yamlPath: [...params.yamlPath],
    ...(nearestYamlPath === undefined ? {} : { nearestYamlPath: [...nearestYamlPath] }),
    reason: params.unresolved?.reason ?? "unresolved-export-claim",
    rawBytes: new TextEncoder().encode(JSON.stringify(params.fallbackXml)).byteLength,
  }
}

function proofBoundaryCoversDifference(
  boundary: XmlAnomalyProofBoundary,
  difference: XmlStructureDifference,
): boolean {
  if (!boundary.presentInSource) {
    return isXmlPathAtOrBelow(difference.path, boundary.xmlPath)
  }
  if (!isCapturedProofBoundary(boundary)) return difference.path === boundary.xmlPath
  return boundary.targets.some((target) =>
    difference.path === target.path
    || (typeof target.signature === "bigint" && isXmlPathAtOrBelow(difference.path, target.path))
  )
}

function localizedDifferenceBoundary(params: {
  readonly source: XmlAnomalyProofAudit["sources"][number]
  readonly localized: LocalizedXmlDifference
  readonly sourceNodes: ReadonlyMap<string, XmlImportAuditedNode>
  readonly sourceElements: ReadonlyMap<string, XmlElementNode>
}): XmlAnomalyProofAuditBoundary | undefined {
  const target = params.sourceNodes.get(params.localized.difference.path)
  if (target === undefined) return undefined
  const xmlPath = owningElementPath(target)
  const element = params.sourceElements.get(xmlPath)
  if (element === undefined) return undefined
  const rawYamlPath = localizedRawYamlPath(params.localized.address, xmlPath)
  if (rawYamlPath === undefined) return undefined
  const owner = params.localized.address.kind === "item"
    && params.localized.address.xmlPath !== xmlPath
    ? params.sourceElements.get(params.localized.address.xmlPath)
    : undefined
  return {
    sourcePath: params.source.sourcePath,
    sourceRole: params.source.role,
    xmlPath,
    yamlPath: [...params.localized.address.yamlPath],
    rulePath: params.localized.address.rulePath.map(({ propertyKey }) => propertyKey),
    presentInSource: true,
    targetPaths: [target.path],
    targets: [{
      path: target.path,
      signature: nodeSignature(target),
      span: { ...target.span },
    }],
    levels: [
      {
        xmlPath,
        yamlPath: [...params.localized.address.yamlPath],
        rawYamlPath,
        protectedYamlPaths: [],
        elementName: element.name,
        structuralHash: element.structuralHash,
        span: { ...element.span },
      },
      ...(owner === undefined
        ? []
        : [{
            xmlPath: owner.path,
            yamlPath: [...params.localized.address.yamlPath],
            rawYamlPath: [...params.localized.address.yamlPath],
            protectedYamlPaths: [],
            elementName: owner.name,
            structuralHash: owner.structuralHash,
            span: { ...owner.span },
          }]),
    ],
  }
}

function localizedRawYamlPath(
  address: XmlRuleAddress,
  elementPath: string,
): readonly (string | number)[] | undefined {
  if (address.kind === "property") return [...address.yamlPath]
  const relative = relativeXmlElementNames(address.xmlPath, elementPath)
  if (relative === undefined || relative.length === 0) return undefined
  return [...address.yamlPath, relative.join("\\")]
}

function isCapturedProofBoundary(
  boundary: XmlAnomalyProofBoundary,
): boundary is XmlAnomalyProofAudit["boundaries"][number] {
  return "targets" in boundary && Array.isArray(boundary.targets) && Array.isArray(boundary.levels)
}

function isAcceptedSourceAbsence(
  boundary: XmlAnomalyProofBoundary,
  exportedNodes: ReadonlyMap<string, XmlImportAuditedNode> | undefined,
): boolean {
  return (
    boundary.auditState === "semanticallyElided"
    || boundary.auditState === "externallyPersisted"
  )
    && exportedNodes?.get(boundary.xmlPath) === undefined
}

function exportedDocumentForSource(
  exported: readonly {
    readonly role: ImportXmlInput["role"]
    readonly sourcePath?: string
    readonly document: XmlDocument
  }[],
  source: Pick<XmlAnomalyProofAudit["sources"][number], "role" | "sourcePath">,
): XmlDocument | undefined {
  const roleMatches = exported.filter((candidate) => candidate.role === source.role)
  const exact = roleMatches.filter((candidate) => candidate.sourcePath === source.sourcePath)
  const hasSourceIdentity = roleMatches.some(({ sourcePath }) => sourcePath !== undefined)
  const matches = hasSourceIdentity ? exact : roleMatches
  return matches.length === 1 ? matches[0]!.document : undefined
}

function sourceRootsAreExact(
  sourceRoots: XmlAnomalyProofAudit["sources"][number]["roots"],
  exported: XmlDocument,
): boolean {
  if (sourceRoots.length !== exported.roots.length) return false
  const exportedByPath = new Map(exported.roots.map((root) => [root.path, root] as const))
  return sourceRoots.every((source) => exportedByPath.get(source.xmlPath)?.structuralHash === source.structuralHash)
}

function sameElementShell(left: XmlElementNode, right: XmlElementNode): boolean {
  return left.name === right.name
    && left.attributes.length === right.attributes.length
    && left.attributes.every((attribute, index) => {
      const other = right.attributes[index]
      return other !== undefined
        && attribute.name === other.name
        && attribute.value === other.value
    })
}

function directElementOrder(element: XmlElementNode): string[] {
  return element.content.flatMap((node) => node.type === "element" ? [node.name] : [])
}

function directContentOrderPatch(element: XmlElementNode): XmlRawValue {
  const text = element.content.flatMap((node) => node.type === "text" ? [node.value] : [])
  const order = element.content.map((node) =>
    node.type === "text" ? "#text" : node.type === "element" ? node.name : `?${node.target}`
  )
  return text.length === 0
    ? { "#order": order }
    : {
      "#text": text,
      "#order": order,
    }
}

function canonicalDirectElementOrder(params: {
  readonly rootRule: MetadataItemRule
  readonly resolvedItemRules: ResolvedXmlAnomalyItemRuleIndex
  readonly itemAnchors: readonly XmlAnomalyItemAnchor[]
  readonly sourcePath: string
  readonly sourceRootPaths: readonly string[]
  readonly xmlPath: string
}): readonly string[] | undefined {
  const anchor = params.itemAnchors
    .filter((candidate) =>
      candidate.sourcePath === params.sourcePath
      && isXmlPathAtOrBelow(params.xmlPath, candidate.xmlPath)
    )
    .sort((left, right) => xmlPathDepth(right.xmlPath) - xmlPathDepth(left.xmlPath))[0]
  const sourceRootPath = params.sourceRootPaths
    .filter((candidate) => isXmlPathAtOrBelow(params.xmlPath, candidate))
    .sort((left, right) => xmlPathDepth(right) - xmlPathDepth(left))[0]
  const ruleRootPath = anchor?.xmlPath ?? sourceRootPath
  const rule = anchor === undefined
    ? sourceRootPath === undefined ? undefined : params.rootRule
    : compiledRuleAtPath({
        rootRule: params.rootRule,
        rulePath: anchor.rulePath,
        yamlPath: anchor.yamlPath,
        sourcePath: params.sourcePath,
        resolvedItemRules: params.resolvedItemRules,
      })
  if (rule === undefined || ruleRootPath === undefined) return undefined
  const containerPrefix = relativeXmlElementNames(ruleRootPath, params.xmlPath)
  if (containerPrefix === undefined) return undefined
  const order: string[] = []
  const seen = new Set<string>()
  const plan = getYAMLToXMLPlan(rule)
  const plannedByKey = new Map(plan.properties.map((planned) => [planned.propertyKey, planned]))
  for (const propertyKey of getCompiledXMLPropertyOrder(rule)) {
    const planned = plannedByKey.get(propertyKey)
    if (planned === undefined) continue
    if (!startsWithStringPath(planned.xmlPath, containerPrefix)) continue
    const elementName = planned.xmlPath[containerPrefix.length]
    if (
      elementName === undefined
      || elementName.startsWith("_")
      || elementName === "#text"
      || seen.has(elementName)
    ) continue
    seen.add(elementName)
    order.push(elementName)
  }
  return order.length === 0 ? undefined : order
}

function isXmlPathAtOrBelow(path: string, parent: string): boolean {
  return path === parent || path.startsWith(`${parent}/`)
}

function relativeXmlElementNames(parent: string, path: string): readonly string[] | undefined {
  if (!isXmlPathAtOrBelow(path, parent)) return undefined
  return path.slice(parent.length).split("/").filter(Boolean).map((segment) =>
    segment.replace(/\[\d+\]$/u, "")
  )
}

function followsCanonicalDirectElementOrder(
  actual: readonly string[],
  canonical: readonly string[],
): boolean {
  if (new Set(actual).size !== actual.length) return false
  const canonicalSet = new Set(canonical)
  if (actual.some((elementName) => !canonicalSet.has(elementName))) return false
  const present = new Set(actual)
  return sameStrings(actual, canonical.filter((elementName) => present.has(elementName)))
}

function sameStrings(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index])
}

function sameStringMultiset(left: readonly string[], right: readonly string[]): boolean {
  if (left.length !== right.length) return false
  const counts = new Map<string, number>()
  for (const value of left) counts.set(value, (counts.get(value) ?? 0) + 1)
  for (const value of right) {
    const count = counts.get(value)
    if (count === undefined) return false
    if (count === 1) counts.delete(value)
    else counts.set(value, count - 1)
  }
  return counts.size === 0
}

function containerRawYamlPath(
  orderPath: readonly (string | number)[],
): readonly (string | number)[] | undefined {
  const last = orderPath.at(-1)
  if (last === "#order") return orderPath.slice(0, -1)
  if (typeof last !== "string" || !last.endsWith("\\#order")) return undefined
  return [...orderPath.slice(0, -1), last.slice(0, -"\\#order".length)]
}

function orderRawYamlPath(
  boundaries: readonly XmlAnomalyProofBoundary[],
  xmlPath: string,
): readonly (string | number)[] | undefined {
  const candidates = new Map<string, readonly (string | number)[]>()
  for (const boundary of boundaries) {
    for (const level of boundary.levels ?? []) {
      if (level.xmlPath !== xmlPath || level.rawYamlPath === undefined) continue
      candidates.set(JSON.stringify(level.rawYamlPath), level.rawYamlPath)
    }
  }
  if (candidates.size === 0) return undefined
  const paths = [...candidates.values()]
  if (paths.length === 1) {
    const path = paths[0]!
    const last = path.at(-1)
    if (typeof last !== "string") return undefined
    return [...path.slice(0, -1), `${last}\\#order`]
  }
  const common: (string | number)[] = []
  const limit = Math.min(...paths.map((path) => path.length))
  for (let index = 0; index < limit; index += 1) {
    const segment = paths[0]?.[index]
    if (paths.some((path) => path[index] !== segment)) break
    common.push(segment!)
  }
  const hasXmlParentInsideBoundary = boundaries.some((boundary) => {
    const levels = boundary.levels ?? []
    const index = levels.findIndex((level) => level.xmlPath === xmlPath)
    return index >= 0 && index + 1 < levels.length
  })
  if (!hasXmlParentInsideBoundary) {
    return common.length === 0 && parentElementPath(xmlPath) !== undefined
      ? [`${elementNameFromPath(xmlPath)}\\#order`]
      : [...common, "#order"]
  }
  return [...common, `${elementNameFromPath(xmlPath)}\\#order`]
}

function elementNameFromPath(xmlPath: string): string {
  const segment = xmlPath.slice(xmlPath.lastIndexOf("/") + 1)
  const match = /^(.*)\[\d+\]$/u.exec(segment)
  if (match?.[1] === undefined) throw new Error(`Недопустимый структурный XML-путь: ${xmlPath}`)
  return match[1]
}

function publicRawYamlPath(
  path: readonly (string | number)[],
  boundary: Pick<XmlAnomalyProofBoundary, "sourcePath" | "sourceRole">,
  hasSemanticValue: boolean,
): readonly (string | number)[] {
  if (hasSemanticValue) return path
  if (path.length === 0) {
    return [boundary.sourceRole === "metadata" ? "@" : `@${xmlDocumentShortName(boundary.sourcePath)}`]
  }
  if (boundary.sourceRole === "metadata") return path
  const last = path.at(-1)
  if (typeof last !== "string") {
    throw new Error(`Raw дополнительного XML-документа требует строковый YAML-ключ: /${path.join("/")}`)
  }
  return [
    ...path.slice(0, -1),
    `@${xmlDocumentShortName(boundary.sourcePath)}\\${last}`,
  ]
}

function hasRawForBoundary(
  annotationIndex: ReturnType<typeof createProofAnnotationIndex>,
  boundary: XmlAnomalyProofBoundary,
): boolean {
  if (hasRawAtOrAbovePath(annotationIndex, boundary.yamlPath)) return true
  if (boundary.presentInSource) return false
  return hasRawAtOrAbovePath(
    annotationIndex,
    publicRawYamlPath(boundary.yamlPath, boundary, false),
  )
}

function xmlDocumentShortName(sourcePath: string): string {
  const fileName = sourcePath.replaceAll("\\", "/").split("/").at(-1)
  if (fileName === undefined || !fileName.endsWith(".xml")) {
    throw new Error(`Не удалось определить краткое имя XML-документа: ${sourcePath}`)
  }
  const result = fileName.slice(0, -".xml".length)
  if (result.length === 0) throw new Error(`Не удалось определить краткое имя XML-документа: ${sourcePath}`)
  return result
}

export async function selectXmlAnomalyRawLevel(params: {
  readonly boundary: XmlAnomalyProofBoundary
  readonly annotations: XmlAnomalyAnnotationsSnapshot
  readonly verify: (level: XmlAnomalyProofLevel) => Promise<boolean>
}): Promise<XmlAnomalyProofLevel> {
  const levels = params.boundary.levels ?? []
  if (levels.length === 0) throw new Error(`У XML-границы ${params.boundary.xmlPath} нет source-level`)
  for (let index = 0; index < levels.length; index += 1) {
    const level = levels[index]!
    const child = levels[index - 1]
    if (child !== undefined) {
      assertNoIndependentAnnotation(params.annotations, child.yamlPath, level.yamlPath)
      assertNoIndependentPropertyRule(level)
    }
    if (await params.verify(level)) return level
  }
  throw new Error(`Исчерпан бюджет подъёма XML-границы ${params.boundary.xmlPath}`)
}

function assertNoIndependentPropertyRule(level: XmlAnomalyProofLevel): void {
  const protectedPaths = level.protectedYamlPaths ?? []
  if (protectedPaths.length === 0) return
  throw new Error(
    `Подъём raw на ${level.xmlPath} поглощает независимый ordinary PropertyRule: ${protectedPaths.map((path) => `/${path.join("/")}`).join(", ")}`,
  )
}

function assertNoIndependentAnnotation(
  annotations: XmlAnomalyAnnotationsSnapshot,
  childPath: readonly (string | number)[],
  parentPath: readonly (string | number)[],
): void {
  for (const entry of annotations.entries) {
    const path = [...entry.parentPath, entry.key]
    if (startsWith(path, parentPath) && !startsWith(path, childPath)) {
      throw new Error(
        `Подъём raw /${childPath.join("/")} → /${parentPath.join("/")} поглощает независимую YAML-аннотацию /${path.join("/")}`,
      )
    }
  }
}

interface ProofAnnotationIndex {
  readonly rootRaw: boolean
  readonly rawByRuntimePath: ReadonlyMap<string, XmlAnomalyAnnotationsSnapshot["entries"][number]["annotation"]>
  readonly rawLogicalPaths: ReadonlySet<string>
}

function createProofAnnotationIndex(
  annotations: XmlAnomalyAnnotationsSnapshot,
): ProofAnnotationIndex {
  const rawByRuntimePath = new Map<
    string,
    XmlAnomalyAnnotationsSnapshot["entries"][number]["annotation"]
  >()
  const rawLogicalPaths = new Set<string>()
  for (const entry of annotations.entries) {
    if (entry.annotation.kind !== "raw") continue
    rawByRuntimePath.set(yamlPathKey([...entry.parentPath, entry.key]), entry.annotation)
    const logicalKey = entry.annotation.target === "key"
      ? entry.annotation.logicalKey ?? entry.key
      : entry.key
    rawLogicalPaths.add(yamlPathKey([...entry.parentPath, logicalKey]))
  }
  return {
    rootRaw: annotations.root?.kind === "raw",
    rawByRuntimePath,
    rawLogicalPaths,
  }
}

function hasRawAtOrAbovePath(
  annotations: ProofAnnotationIndex,
  path: readonly (string | number)[],
): boolean {
  if (annotations.rootRaw) return true
  for (let length = path.length; length > 0; length -= 1) {
    if (annotations.rawLogicalPaths.has(yamlPathKey(path.slice(0, length)))) return true
  }
  return false
}

function yamlPathKey(path: readonly (string | number)[]): string {
  return JSON.stringify(path)
}

function withRawAnnotation(
  annotations: XmlAnomalyAnnotationsSnapshot,
  path: readonly (string | number)[],
  xml: XmlRawValue,
  hasSemanticValue: boolean,
  replacedPath: readonly (string | number)[] = path,
): XmlAnomalyAnnotationsSnapshot {
  if (path.length === 0) {
    throw new Error("Корневой raw не поддерживается XML proof")
  }
  const parentPath = path.slice(0, -1)
  const key = path.at(-1)!
  return {
    version: 1,
    ...(annotations.root === undefined ? {} : { root: annotations.root }),
    entries: [
      ...annotations.entries.filter((entry) => {
        const currentPath = [...entry.parentPath, entry.key]
        return !startsWith(currentPath, path) && !startsWith(currentPath, replacedPath)
      }),
      {
        parentPath,
        key,
        annotation: {
          kind: "raw",
          occurrence: 1,
          target: "value",
          xml,
          hasSemanticValue,
        },
      },
    ],
  }
}

function setRawYamlValue(
  data: unknown,
  path: readonly (string | number)[],
  value: unknown,
  replacedPath: readonly (string | number)[] = path,
): void {
  if (path.length === 0) throw new Error("Корневой raw не поддерживается XML proof")
  const replacedParent = !sameYamlPath(path, replacedPath)
    ? deleteYamlValue(data, replacedPath)
    : undefined
  let parent = data
  for (const segment of path.slice(0, -1)) {
    if (!isObject(parent)) throw new Error(`Не найдена YAML-граница /${path.join("/")}`)
    let child = parent[segment]
    if (child === undefined && typeof segment === "string") {
      child = {}
      parent[segment] = child
    }
    if (!isObject(child)) throw new Error(`Не найдена YAML-граница /${path.join("/")}`)
    parent = child
  }
  if (!isObject(parent)) throw new Error(`Не найдена YAML-граница /${path.join("/")}`)
  parent[path.at(-1)!] = value
  if (replacedParent !== undefined && replacedParent.parent === parent && typeof path.at(-1) === "string") {
    markYAMLMappingKeyOrder(parent, replacedParent.keys.map((key) =>
      key === replacedParent.key ? String(path.at(-1)) : key
    ))
  }
}

function assertRawYamlPathAvailable(
  data: unknown,
  annotations: XmlAnomalyAnnotationsSnapshot,
  path: readonly (string | number)[],
  replacedPath: readonly (string | number)[],
): void {
  if (sameYamlPath(path, replacedPath)) return
  const parentPath = path.slice(0, -1)
  const key = path.at(-1)
  const parent = valueAtYamlPath(data, parentPath)
  const hasPhysicalValue = key !== undefined
    && isObject(parent)
    && Object.prototype.hasOwnProperty.call(parent, key)
  const hasLogicalKey = annotations.entries.some((entry) =>
    sameYamlPath(entry.parentPath, parentPath)
    && (entry.annotation.target === "key" ? entry.annotation.logicalKey ?? entry.key : entry.key) === key
  )
  if (!hasPhysicalValue && !hasLogicalKey) return
  throw new Error(`Коллизия YAML-границы raw /${path.join("/")}: существующее значение нельзя перезаписать`)
}

function deleteYamlValue(data: unknown, path: readonly (string | number)[]): {
  readonly parent: Record<string | number, unknown>
  readonly key: string | number
  readonly keys: readonly string[]
} {
  if (path.length === 0) throw new Error("Корневой raw не поддерживается XML proof")
  let parent = data
  for (const segment of path.slice(0, -1)) {
    if (!isObject(parent) || !isObject(parent[segment])) {
      throw new Error(`Не найдена YAML-граница /${path.join("/")}`)
    }
    parent = parent[segment]
  }
  if (!isObject(parent)) throw new Error(`Не найдена YAML-граница /${path.join("/")}`)
  const key = path.at(-1)!
  const keys = Array.isArray(parent) ? Object.keys(parent) : yamlMappingKeys(parent)
  delete parent[key]
  return { parent, key, keys }
}

function sameYamlPath(
  left: readonly (string | number)[],
  right: readonly (string | number)[],
): boolean {
  return left.length === right.length && left.every((segment, index) => segment === right[index])
}

function singleExportedDocument(
  exported: readonly {
    readonly role: ImportXmlInput["role"]
    readonly sourcePath?: string
    readonly document: XmlDocument
  }[],
  boundary: Pick<XmlAnomalyProofBoundary, "sourceRole" | "sourcePath" | "presentInSource">,
): XmlDocument | undefined {
  const roleMatches = exported.filter((candidate) => candidate.role === boundary.sourceRole)
  const exact = roleMatches.filter((candidate) => candidate.sourcePath === boundary.sourcePath)
  const hasSourceIdentity = roleMatches.some(({ sourcePath }) => sourcePath !== undefined)
  const matches = hasSourceIdentity ? exact : roleMatches
  if (!boundary.presentInSource && matches.length === 0) return undefined
  if (matches.length !== 1) {
    throw new Error(
      `Proof требует один экспортированный XML-документ ${boundary.sourcePath}, получено ${matches.length}`,
    )
  }
  return matches[0]!.document
}

function elementAncestry(
  elements: ReadonlyMap<string, XmlElementNode>,
  path: string,
): XmlElementNode[] {
  const result: XmlElementNode[] = []
  let currentPath: string | undefined = path
  while (currentPath !== undefined) {
    const current = elements.get(currentPath)
    if (current === undefined) break
    result.push(current)
    currentPath = parentElementPath(currentPath)
  }
  return result
}

function hasUniqueXmlAddressFromItemAnchor(params: {
  readonly boundary: XmlAnomalyProofBoundary
  readonly level: XmlAnomalyProofLevel
  readonly itemAnchors: readonly XmlAnomalyItemAnchor[]
  readonly elements: ReadonlyMap<string, XmlElementNode>
}): boolean {
  const candidates = params.itemAnchors
    .filter((candidate) =>
      candidate.sourcePath === params.boundary.sourcePath
      && startsWith(params.boundary.yamlPath, candidate.yamlPath)
      && isElementPathAtOrBelow(params.level.xmlPath, candidate.xmlPath)
    )
    .sort((left, right) => xmlPathDepth(right.xmlPath) - xmlPathDepth(left.xmlPath))
  const anchor = candidates[0]
  if (anchor === undefined) return true

  let current = params.elements.get(params.level.xmlPath)
  while (current !== undefined && current.path !== anchor.xmlPath) {
    const parentPath = parentElementPath(current.path)
    const parent = parentPath === undefined ? undefined : params.elements.get(parentPath)
    if (parent === undefined) return false
    const sameNameCount = parent.content.filter(
      (node): node is XmlElementNode => node.type === "element" && node.name === current!.name,
    ).length
    if (sameNameCount > 1) return false
    current = parent
  }
  return current?.path === anchor.xmlPath
}

function isElementPathAtOrBelow(path: string, rootPath: string): boolean {
  return path === rootPath || path.startsWith(`${rootPath}/`)
}

function owningElementPath(node: XmlImportAuditedNode): string {
  if ("type" in node && node.type === "element") return node.path
  const slash = node.path.lastIndexOf("/")
  if (slash <= 0) throw new Error(`У XML-узла ${node.path} нет element owner`)
  return node.path.slice(0, slash)
}

function commonElementPath(paths: readonly string[]): string {
  if (paths.length === 0) throw new Error("Нельзя вычислить общую XML-границу без путей")
  let parts = paths[0]!.split("/")
  for (const path of paths.slice(1)) {
    const candidate = path.split("/")
    let length = 0
    while (length < parts.length && parts[length] === candidate[length]) length += 1
    parts = parts.slice(0, length)
  }
  const result = parts.join("/")
  if (result.length === 0) throw new Error(`XML-границы не имеют общего element owner: ${paths.join(", ")}`)
  return result
}

function metadataItemRoot(root: XmlElementNode, rule: MetadataItemRule): XmlElementNode {
  const container = Object.values(rule.properties).find(
    (property) => property.type === "XMLRoot" && typeof property.container === "string",
  )?.container
  if (container === undefined) return root
  return root.content.find(
    (child): child is XmlElementNode => child.type === "element" && child.name === container,
  ) ?? root
}

function appendElementPath(rootPath: string, segments: readonly string[]): string {
  return segments.reduce((path, segment) => `${path}/${segment}[1]`, rootPath)
}

function indexXmlDocument(roots: readonly XmlElementNode[]): {
  readonly elements: ReadonlyMap<string, XmlElementNode>
  readonly nodes: ReadonlyMap<string, XmlImportAuditedNode>
} {
  const elements = new Map<string, XmlElementNode>()
  const nodes = new Map<string, XmlImportAuditedNode>()
  const stack: XmlImportAuditedNode[] = [...roots].reverse()
  while (stack.length > 0) {
    const current = stack.pop()!
    xmlPathIndexVisitCountValueForTests += 1
    nodes.set(current.path, current)
    if (!("type" in current)) continue
    if (current.type === "processingInstruction") {
      for (let index = current.attributes.length - 1; index >= 0; index -= 1) {
        stack.push(current.attributes[index]!)
      }
      continue
    }
    if (current.type !== "element") continue
    elements.set(current.path, current)
    for (let index = current.content.length - 1; index >= 0; index -= 1) {
      stack.push(current.content[index]!)
    }
    for (let index = current.attributes.length - 1; index >= 0; index -= 1) {
      stack.push(current.attributes[index]!)
    }
  }
  return { elements, nodes }
}

function targetSignature(
  node: XmlImportAuditedNode | undefined,
  expected: bigint | string,
): bigint | string | undefined {
  if (node === undefined) return undefined
  return "type" in node && node.type === "element" && typeof expected === "string"
    ? auditedNodeSignature(node)
    : nodeSignature(node)
}

function xmlElementAtPath(
  nodes: ReadonlyMap<string, XmlImportAuditedNode> | undefined,
  path: string,
): XmlElementNode | undefined {
  const node = nodes?.get(path)
  return node !== undefined && "type" in node && node.type === "element"
    ? node
    : undefined
}

function nodeSignature(node: XmlImportAuditedNode): bigint | string {
  if (!("type" in node)) return JSON.stringify(["attribute", node.name, node.value])
  if (node.type === "element") return node.structuralHash
  if (node.type === "text") return JSON.stringify(["text", node.value])
  return JSON.stringify([
    "processingInstruction",
    node.target,
    node.body,
    node.attributes.map(({ name, value }) => [name, value]),
  ])
}

function auditedNodeSignature(node: XmlImportAuditedNode, shallow = true): bigint | string {
  // Содержимое контейнера с независимо принадлежащими потомками проверяется
  // отдельными целями их владельцев. Его полный structuralHash иначе поглощал
  // дочернее расхождение и поднимал raw на всю коллекцию.
  return shallow && "type" in node && node.type === "element"
    ? JSON.stringify(["element", node.name])
    : nodeSignature(node)
}

function elementsWithIndependentDescendants(
  outcomes: ReturnType<XmlImportAuditSession["outcomes"]>,
  nodeSource: ReadonlyMap<XmlImportAuditedNode, XmlAnomalyProofSource>,
): ReadonlySet<string> {
  const outcomesByPath = new Map<string, (typeof outcomes)[number]>()
  for (const outcome of outcomes) {
    const source = nodeSource.get(outcome.node)
    if (source !== undefined) outcomesByPath.set(auditedNodeKey(source.sourcePath, outcome.node.path), outcome)
  }
  const shallow = new Set<string>()
  for (const outcome of outcomes) {
    const source = nodeSource.get(outcome.node)
    if (source === undefined || outcome.boundaries.length === 0) continue
    const ownBoundaries = new Set(outcome.boundaries.map(auditBoundaryIdentity))
    const ownerElementPath = owningElementPath(outcome.node)
    let ancestorPath = "type" in outcome.node && outcome.node.type === "element"
      ? parentElementPath(ownerElementPath)
      : ownerElementPath
    while (ancestorPath !== undefined) {
      const ancestor = outcomesByPath.get(auditedNodeKey(source.sourcePath, ancestorPath))
      if (
        ancestor !== undefined
        && ancestor.boundaries.length > 0
        && !ancestor.boundaries.some((boundary) => ownBoundaries.has(auditBoundaryIdentity(boundary)))
      ) {
        shallow.add(auditedNodeKey(source.sourcePath, ancestorPath))
      }
      ancestorPath = parentElementPath(ancestorPath)
    }
  }
  return shallow
}

function auditedNodeKey(sourcePath: string, nodePath: string): string {
  return `${sourcePath}\u0000${nodePath}`
}

function auditBoundaryIdentity(boundary: XmlImportAuditBoundary): string {
  return JSON.stringify([
    boundary.itemType,
    boundary.propertyKey,
    boundary.propertyType,
    boundary.yamlPath,
    boundary.rulePath,
  ])
}

function parentElementPath(path: string): string | undefined {
  const slash = path.lastIndexOf("/")
  return slash <= 0 ? undefined : path.slice(0, slash)
}

function startsWith(
  path: readonly (string | number)[],
  prefix: readonly (string | number)[],
): boolean {
  if (prefix.length > path.length) return false
  for (let index = 0; index < prefix.length; index += 1) {
    if (prefix[index] !== path[index]) return false
  }
  return true
}

function cloneAnnotationSnapshot(
  annotations: XmlAnomalyAnnotationsSnapshot,
): XmlAnomalyAnnotationsSnapshot {
  return {
    version: 1,
    ...(annotations.root === undefined ? {} : { root: { ...annotations.root } }),
    entries: annotations.entries.map((entry) => ({
      parentPath: [...entry.parentPath],
      key: entry.key,
      annotation: { ...entry.annotation },
    })),
  }
}

function isObject(value: unknown): value is Record<string | number, unknown> {
  return value !== null && typeof value === "object"
}

function isStringRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}

function cloneYamlForProof<T>(source: T): T {
  return restoreYamlMetadata(source, structuredClone(source)) as T
}

function restoreYamlMetadata(source: unknown, target: unknown): unknown {
  if (isExplicitYAMLString(source)) return source
  if (!isObject(source) || !isObject(target)) return target
  copyYAMLRuntimeMetadata(source, target)
  if (Array.isArray(source)) {
    if (!Array.isArray(target)) return target
    for (let index = 0; index < source.length; index += 1) {
      target[index] = restoreYamlMetadata(source[index], target[index])
    }
    return target
  }
  if (Array.isArray(target)) return target
  for (const key of Object.keys(source)) {
    target[key] = restoreYamlMetadata(source[key], target[key])
  }
  for (const key of Object.getOwnPropertyNames(source)) {
    if (Object.prototype.propertyIsEnumerable.call(source, key) || Object.prototype.hasOwnProperty.call(target, key)) {
      continue
    }
    const descriptor = Object.getOwnPropertyDescriptor(source, key)
    if (descriptor === undefined) continue
    Object.defineProperty(target, key, "value" in descriptor
      ? { ...descriptor, value: restoreYamlMetadata(descriptor.value, structuredClone(descriptor.value)) }
      : descriptor)
  }
  return target
}
