import {
  decodeXmlRawValue,
  copyYAMLMappingKeyOrder,
  copyYAMLMappingKeyTags,
  copyYAMLMappingTag,
  copyYAMLScalarTags,
  mergeXmlRawFragments,
  parseXmlDocumentWithSaxes,
  restoreXmlAnomalyAnnotations,
  snapshotXmlAnomalyAnnotations,
  xmlElementRawValue,
  type XmlAnomalyAnnotationsSnapshot,
  type XmlDocument,
  type XmlElementNode,
  type XmlImportAuditedNode,
  type XmlImportAuditSession,
  type XmlSourceSpan,
} from "@nkdk/runtime"
import { getTypeRule, getYAMLToXMLPlan, type MetadataItemRule } from "@nkdk/runtime/rule-kit"
import type { ImportXmlInput } from "./types"

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
  readonly boundaries: readonly (XmlAnomalyProofBoundary & {
    readonly targets: readonly {
      readonly path: string
      readonly signature: bigint | string
      readonly span: XmlSourceSpan
    }[]
    readonly levels: readonly XmlAnomalyProofLevel[]
  })[]
}

interface XmlAnomalyItemAnchor {
  readonly sourcePath: string
  readonly xmlPath: string
  readonly yamlPath: readonly (string | number)[]
  readonly rulePath: readonly string[]
}

export function deriveXmlAnomalyProofBoundaries(params: {
  readonly sources: readonly XmlAnomalyProofSource[]
  readonly audit: XmlImportAuditSession
  readonly rule: MetadataItemRule
}): XmlAnomalyProofBoundary[] {
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
    readonly elementPaths: string[]
    readonly targetPaths: string[]
    readonly capturedTargets: {
      readonly path: string
      readonly signature: bigint | string
      readonly span: XmlSourceSpan
    }[]
  }>()
  const itemAnchors: XmlAnomalyItemAnchor[] = []
  for (const outcome of params.audit.outcomes()) {
    if (outcome.state !== "claimed" && outcome.state !== "duplicate" && outcome.state !== "ambiguous") continue
    const source = nodeSource.get(outcome.node)
    if (source === undefined) continue
    const elementPath = owningElementPath(outcome.node)
    if ("type" in outcome.node && outcome.node.type === "element") {
      for (const candidate of outcome.boundaries) {
        const anchorRulePath = candidate.rulePath?.map(({ propertyKey }) => propertyKey) ?? []
        if (candidate.yamlPath === undefined || anchorRulePath.length === 0) continue
        itemAnchors.push({
          sourcePath: source.sourcePath,
          xmlPath: outcome.node.path,
          yamlPath: [...candidate.yamlPath],
          rulePath: anchorRulePath,
        })
      }
    }
    for (const boundary of proofBoundariesForOutcome(outcome)) {
      if (boundary.yamlPath === undefined || boundary.yamlPath.length === 0) continue
      // Одна YAML-граница может собираться несколькими вложенными правилами.
      // Для proof это один кандидат raw, поэтому XML-цели объединяются по
      // итоговому YAML-пути, а не по частному PropertyRule.
      const key = JSON.stringify([source.sourcePath, boundary.yamlPath])
      const current = grouped.get(key)
      if (current === undefined) {
        grouped.set(key, {
          boundary,
          source,
          elementPaths: [elementPath],
          targetPaths: [outcome.node.path],
          capturedTargets: [{
            path: outcome.node.path,
            signature: nodeSignature(outcome.node),
            span: { ...outcome.node.span },
          }],
        })
      } else {
        current.elementPaths.push(elementPath)
        current.targetPaths.push(outcome.node.path)
        current.capturedTargets.push({
          path: outcome.node.path,
          signature: nodeSignature(outcome.node),
          span: { ...outcome.node.span },
        })
      }
    }
  }
  const boundaries: XmlAnomalyProofBoundary[] = [...grouped.values()].map(({
    boundary,
    source,
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
    const levelYamlPaths = compiledLevelYamlPaths(params.rule, effectiveRulePath, yamlPath)
    const elements = elementsBySourcePath.get(source.sourcePath)!
    const levels = elementAncestry(elements, xmlPath)
      .slice(0, levelYamlPaths.length)
      .map((element, index): XmlAnomalyProofLevel => ({
        xmlPath: element.path,
        yamlPath: levelYamlPaths[index] ?? yamlPath,
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
      targetPaths: [...new Set(targetPaths)],
      capturedTargets: [...new Map(capturedTargets.map((target) => [target.path, target])).values()],
      levels,
    }
  })

  const existingYamlPaths = new Set(boundaries.map(({ sourcePath, yamlPath }) =>
    JSON.stringify([sourcePath, yamlPath])
  ))
  const metadataSource = params.sources.find(({ role }) => role === "metadata")
  const metadataRoot = metadataSource?.document.roots.find(({ name }) => name === "MetaDataObject")
  if (metadataSource !== undefined && metadataRoot !== undefined) {
    appendPlannedAbsenceBoundaries({
      sources: params.sources,
      elementsBySourcePath,
      boundaries,
      existingYamlPaths,
      source: metadataSource,
      root: metadataItemRoot(metadataRoot, params.rule),
      rule: params.rule,
      yamlPrefix: [],
      rulePrefix: [],
      itemAnchors,
    })
  } else {
    const bodySource = params.sources.find(({ role }) => role === "body")
    const bodyRoot = bodySource?.document.roots[0]
    if (bodySource !== undefined && bodyRoot !== undefined) {
      appendPlannedAbsenceBoundaries({
        sources: params.sources,
        elementsBySourcePath,
        boundaries,
        existingYamlPaths,
        source: bodySource,
        root: bodyRoot,
        rule: params.rule,
        yamlPrefix: [],
        rulePrefix: [],
        itemAnchors,
      })
    }
  }
  return boundaries
}

function compiledLevelYamlPaths(
  rootRule: MetadataItemRule,
  rulePath: readonly string[],
  yamlPath: readonly (string | number)[],
): readonly (readonly (string | number)[])[] {
  let rule: MetadataItemRule | undefined = rootRule
  const rootToLeaf: (readonly (string | number)[])[] = []
  for (let index = 0; index < rulePath.length && rule !== undefined; index += 1) {
    const propertyKey = rulePath[index]!
    const planned = getYAMLToXMLPlan(rule).properties.find((candidate) => candidate.propertyKey === propertyKey)
    if (planned === undefined) break
    const remainingProperties = rulePath.length - index - 1
    const ownerPath = yamlPath.slice(0, Math.max(1, yamlPath.length - remainingProperties))
    for (let segment = 0; segment < planned.xmlPath.length; segment += 1) {
      rootToLeaf.push(ownerPath)
    }
    rule = nestedItemRule(planned.propertyRule.type)
  }
  return rootToLeaf.length === 0 ? [yamlPath] : rootToLeaf.reverse()
}

function appendPlannedAbsenceBoundaries(params: {
  readonly sources: readonly XmlAnomalyProofSource[]
  readonly elementsBySourcePath: ReadonlyMap<string, ReadonlyMap<string, XmlElementNode>>
  readonly boundaries: XmlAnomalyProofBoundary[]
  readonly existingYamlPaths: Set<string>
  readonly source: XmlAnomalyProofSource
  readonly root: XmlElementNode
  readonly rule: MetadataItemRule
  readonly yamlPrefix: readonly (string | number)[]
  readonly rulePrefix: readonly string[]
  readonly itemAnchors: readonly XmlAnomalyItemAnchor[]
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
    const nested = nestedItemRule(planned.propertyRule.type)
    const nestedConversion = getTypeRule(planned.propertyRule.type, "yamlToXMLNestedRule")
    if (element !== undefined && nested !== undefined && nestedConversion?.kind === "collection") {
      const anchors = params.itemAnchors.filter((anchor) =>
        anchor.sourcePath === params.source.sourcePath
        && sameStringPath(anchor.rulePath, rulePath)
        && sameElementSeries(anchor.xmlPath, xmlPath)
      )
      for (const anchor of anchors) {
        const itemRoot = elements?.get(anchor.xmlPath)
        if (itemRoot === undefined) continue
        appendPlannedAbsenceBoundaries({
          ...params,
          root: itemRoot,
          rule: nested,
          yamlPrefix: anchor.yamlPath,
          rulePrefix: rulePath,
        })
      }
      continue
    }
    if (element !== undefined && nested !== undefined) {
      appendPlannedAbsenceBoundaries({
        ...params,
        root: element,
        rule: nested,
        yamlPrefix: yamlPath,
        rulePrefix: rulePath,
      })
      continue
    }
    if (element !== undefined) continue
    const key = JSON.stringify([params.source.sourcePath, yamlPath])
    if (params.existingYamlPaths.has(key)) continue
    params.existingYamlPaths.add(key)
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

function sameStringPath(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((segment, index) => segment === right[index])
}

function sameElementSeries(left: string, right: string): boolean {
  return left.replace(/\[\d+\]$/u, "[1]") === right.replace(/\[\d+\]$/u, "[1]")
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
  return candidates.find(({ sourcePath }) => sourcePath.replaceAll("\\", "/").endsWith(`/${normalized}`))
    ?? (candidates.length === 1 ? candidates[0] : undefined)
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

export function captureXmlAnomalyProofAudit(params: {
  readonly sources: readonly XmlAnomalyProofSource[]
  readonly boundaries: readonly XmlAnomalyProofBoundary[]
}): XmlAnomalyProofAudit {
  const sourceByPath = new Map(params.sources.map((source) => [source.sourcePath, source] as const))
  const needsIndex = params.boundaries.some((boundary) =>
    boundary.presentInSource && (boundary.levels === undefined || boundary.capturedTargets === undefined)
  )
  const indexesBySourcePath = needsIndex
    ? new Map(params.sources.map((source) => [source.sourcePath, indexXmlDocument(source.document.roots)] as const))
    : new Map<string, ReturnType<typeof indexXmlDocument>>()
  const boundaries = params.boundaries.map((boundary) => {
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
  })
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
  }
}

export interface ProveXmlAnomalyBoundariesResult {
  readonly data: unknown
  readonly annotations: XmlAnomalyAnnotationsSnapshot
  readonly rereadSourcePaths: readonly string[]
}

export async function proveXmlAnomalyBoundaries(params: {
  readonly data: unknown
  readonly annotations: XmlAnomalyAnnotationsSnapshot
  readonly audit: XmlAnomalyProofAudit
  readonly exported: readonly {
    readonly role: ImportXmlInput["role"]
    readonly sourcePath?: string
    readonly document: XmlDocument
  }[]
  readonly readSource: (sourcePath: string) => Promise<string>
}): Promise<ProveXmlAnomalyBoundariesResult> {
  const data = cloneYamlForProof(params.data)
  let annotationSnapshot = cloneAnnotationSnapshot(params.annotations)
  const rereadDocuments = new Map<string, XmlDocument>()
  const rereadElements = new Map<string, ReadonlyMap<string, XmlElementNode>>()
  const rereadNodes = new Map<string, ReadonlyMap<string, XmlImportAuditedNode>>()
  const exportedElements = new Map(
    params.exported.map(({ document }) => [document, indexXmlDocument(document.roots).nodes] as const),
  )
  const rereadSourcePaths: string[] = []

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

  for (const boundary of params.audit.boundaries) {
    const exported = singleExportedDocument(params.exported, boundary)
    const exact = boundary.presentInSource
      ? boundary.targets.length > 0 && boundary.targets.every((target) =>
          targetSignature(exportedElements.get(exported)?.get(target.path)) === target.signature
        )
      : exportedElements.get(exported)?.get(boundary.xmlPath) === undefined
    if (exact || hasRawAtOrAbovePath(annotationSnapshot, boundary.yamlPath)) continue

    if (!boundary.presentInSource) {
      setRawYamlValue(data, boundary.yamlPath, null)
      annotationSnapshot = withRawAnnotation(annotationSnapshot, boundary.yamlPath)
      continue
    }

    await readDocument(boundary.sourcePath)
    const sourceElements = rereadElements.get(boundary.sourcePath)!
    const sourceNodes = rereadNodes.get(boundary.sourcePath)!
    const firstSource = sourceElements.get(boundary.xmlPath)
    if (
      firstSource === undefined
      || boundary.targets.some((target) => targetSignature(sourceNodes.get(target.path)) !== target.signature)
    ) {
      throw new Error(`Исходный XML изменился после первого прохода: ${boundary.sourcePath} ${boundary.xmlPath}`)
    }
    const selected = await selectXmlAnomalyRawLevel({
      boundary,
      annotations: annotationSnapshot,
      verify: async (level) => {
        const source = sourceElements.get(level.xmlPath)
        if (source === undefined || source.structuralHash !== level.structuralHash) return false
        try {
          const raw = xmlElementRawValue(source)
          const decoded = decodeXmlRawValue(raw, { elementName: source.name }).nodes[0]
          if (decoded === undefined || decoded.structuralHash !== source.structuralHash) return false
          const mergePath = rawMergePath(level.xmlPath)
          if (mergePath === undefined) return false
          const merged = mergeXmlRawFragments(exported.roots, [{
            path: mergePath.path,
            occurrencePath: mergePath.occurrences,
            value: raw,
            suppressOrdinaryOutput: true,
          }])
          const levelIndex = boundary.levels.findIndex(({ xmlPath }) => xmlPath === level.xmlPath)
          const comparison = boundary.levels[levelIndex + 1] ?? level
          const mergedComparison = indexXmlDocument(merged).elements.get(comparison.xmlPath)
          const sourceComparison = sourceElements.get(comparison.xmlPath)
          if (mergedComparison === undefined || sourceComparison === undefined) return false
          return comparison === level
            ? mergedComparison.structuralHash === sourceComparison.structuralHash
            : sameElementShell(mergedComparison, sourceComparison)
        } catch {
          return false
        }
      },
    })
    const selectedSource = sourceElements.get(selected.xmlPath)
    if (selectedSource === undefined) throw new Error(`Не найдена выбранная XML-граница ${selected.xmlPath}`)
    setRawYamlValue(data, selected.yamlPath, xmlElementRawValue(selectedSource))
    annotationSnapshot = withRawAnnotation(annotationSnapshot, selected.yamlPath)
  }

  const annotations = restoreXmlAnomalyAnnotations(data, annotationSnapshot)
  return {
    data,
    annotations: snapshotXmlAnomalyAnnotations(data, annotations),
    rereadSourcePaths,
  }
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

function rawMergePath(xmlPath: string): {
  readonly path: string
  readonly occurrences: readonly number[]
} | undefined {
  const segments = xmlPath.split("/").filter(Boolean).map((segment) => {
    const match = /^(.*)\[(\d+)\]$/u.exec(segment)
    if (match === null || match[1] === undefined || match[2] === undefined) {
      throw new Error(`Недопустимый структурный XML-путь: ${xmlPath}`)
    }
    return { name: match[1], occurrence: Number(match[2]) }
  })
  const relative = segments.slice(1)
  if (relative.length === 0) return undefined
  return {
    path: relative.map(({ name }) => name).join("\\"),
    occurrences: relative.map(({ occurrence }) => occurrence),
  }
}

export async function selectXmlAnomalyRawLevel(params: {
  readonly boundary: XmlAnomalyProofBoundary
  readonly annotations: XmlAnomalyAnnotationsSnapshot
  readonly verify: (level: XmlAnomalyProofLevel) => Promise<boolean>
}): Promise<XmlAnomalyProofLevel> {
  const levels = params.boundary.levels ?? []
  if (levels.length === 0) throw new Error(`У XML-границы ${params.boundary.xmlPath} нет source-level`)
  const budget = levels.length
  const first = levels[0]!
  if (await params.verify(first)) return first
  if (budget < 2) throw new Error(`Исчерпан бюджет подъёма XML-границы ${params.boundary.xmlPath}`)
  const parent = levels[1]!
  assertNoIndependentAnnotation(params.annotations, first.yamlPath, parent.yamlPath)
  if (await params.verify(parent)) return parent
  throw new Error(`Повторное несовпадение поднятой XML-границы ${parent.xmlPath}`)
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

function hasRawAtOrAbovePath(
  annotations: XmlAnomalyAnnotationsSnapshot,
  path: readonly (string | number)[],
): boolean {
  if (annotations.root?.kind === "raw") return true
  return annotations.entries.some((entry) => {
    if (entry.annotation.target !== "value" || entry.annotation.kind !== "raw") return false
    return startsWith(path, [...entry.parentPath, entry.key])
  })
}

function withRawAnnotation(
  annotations: XmlAnomalyAnnotationsSnapshot,
  path: readonly (string | number)[],
): XmlAnomalyAnnotationsSnapshot {
  if (path.length === 0) {
    return {
      version: 1,
      root: { kind: "raw", occurrence: 1, target: "root" },
      entries: [],
    }
  }
  const parentPath = path.slice(0, -1)
  const key = path.at(-1)!
  return {
    version: 1,
    ...(annotations.root === undefined ? {} : { root: annotations.root }),
    entries: [
      ...annotations.entries.filter((entry) => {
        const currentPath = [...entry.parentPath, entry.key]
        return !startsWith(currentPath, path)
      }),
      {
        parentPath,
        key,
        annotation: { kind: "raw", occurrence: 1, target: "value" },
      },
    ],
  }
}

function setRawYamlValue(
  data: unknown,
  path: readonly (string | number)[],
  value: unknown,
): void {
  if (path.length === 0) throw new Error("Корневой raw не поддерживается XML proof")
  let parent = data
  for (const segment of path.slice(0, -1)) {
    if (!isObject(parent)) throw new Error(`Не найдена YAML-граница /${path.join("/")}`)
    const child = parent[segment]
    if (!isObject(child)) throw new Error(`Не найдена YAML-граница /${path.join("/")}`)
    parent = child
  }
  if (!isObject(parent)) throw new Error(`Не найдена YAML-граница /${path.join("/")}`)
  parent[path.at(-1)!] = value
}

function singleExportedDocument(
  exported: readonly {
    readonly role: ImportXmlInput["role"]
    readonly sourcePath?: string
    readonly document: XmlDocument
  }[],
  boundary: Pick<XmlAnomalyProofBoundary, "sourceRole" | "sourcePath">,
): XmlDocument {
  const roleMatches = exported.filter((candidate) => candidate.role === boundary.sourceRole)
  const exact = roleMatches.filter((candidate) => candidate.sourcePath === boundary.sourcePath)
  const matches = exact.length > 0 ? exact : roleMatches
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

function targetSignature(node: XmlImportAuditedNode | undefined): bigint | string | undefined {
  return node === undefined ? undefined : nodeSignature(node)
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

function cloneYamlForProof<T>(source: T): T {
  const clone = structuredClone(source)
  copyYamlMetadataDeep(source, clone)
  return clone
}

function copyYamlMetadataDeep(source: unknown, target: unknown): void {
  if (!isObject(source) || !isObject(target)) return
  copyYAMLScalarTags(source, target)
  copyYAMLMappingTag(source, target)
  copyYAMLMappingKeyOrder(source, target)
  copyYAMLMappingKeyTags(source, target)
  if (Array.isArray(source) && Array.isArray(target)) {
    for (let index = 0; index < source.length; index += 1) {
      copyYamlMetadataDeep(source[index], target[index])
    }
    return
  }
  if (Array.isArray(source) || Array.isArray(target)) return
  for (const key of Object.keys(source)) copyYamlMetadataDeep(source[key], target[key])
}
