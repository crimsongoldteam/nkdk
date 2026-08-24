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
import { getYAMLToXMLPlan, type MetadataItemRule } from "@nkdk/runtime/rule-kit"
import type { ImportXmlInput } from "./types"

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

export function deriveXmlAnomalyProofBoundaries(params: {
  readonly sources: readonly XmlAnomalyProofSource[]
  readonly audit: XmlImportAuditSession
  readonly rule: MetadataItemRule
}): XmlAnomalyProofBoundary[] {
  const nodeSource = new Map<XmlImportAuditedNode, XmlAnomalyProofSource>()
  const elementsBySourcePath = new Map<string, ReadonlyMap<string, XmlElementNode>>()
  for (const source of params.sources) {
    elementsBySourcePath.set(source.sourcePath, indexElements(source.document.roots))
    for (const root of source.document.roots) {
      for (const node of auditedSubtree(root)) nodeSource.set(node, source)
    }
  }
  const grouped = new Map<string, {
    readonly boundary: NonNullable<ReturnType<XmlImportAuditSession["outcomes"]>[number]["boundaries"][number]>
    readonly source: XmlAnomalyProofSource
    readonly elementPaths: string[]
    readonly targetPaths: string[]
  }>()
  for (const outcome of params.audit.outcomes()) {
    if (outcome.state !== "claimed" && outcome.state !== "duplicate" && outcome.state !== "ambiguous") continue
    const source = nodeSource.get(outcome.node)
    if (source === undefined) continue
    const elementPath = owningElementPath(outcome.node)
    for (const boundary of proofBoundariesForOutcome(outcome)) {
      if (boundary.yamlPath === undefined || boundary.yamlPath.length === 0) continue
      // Одна YAML-граница может собираться несколькими вложенными правилами.
      // Для proof это один кандидат raw, поэтому XML-цели объединяются по
      // итоговому YAML-пути, а не по частному PropertyRule.
      const key = JSON.stringify([source.sourcePath, boundary.yamlPath])
      const current = grouped.get(key)
      if (current === undefined) {
        grouped.set(key, { boundary, source, elementPaths: [elementPath], targetPaths: [outcome.node.path] })
      } else {
        current.elementPaths.push(elementPath)
        current.targetPaths.push(outcome.node.path)
      }
    }
  }
  const boundaries: XmlAnomalyProofBoundary[] = [...grouped.values()].map(({
    boundary,
    source,
    elementPaths,
    targetPaths,
  }) => ({
    sourcePath: source.sourcePath,
    sourceRole: source.role,
    xmlPath: commonElementPath(elementPaths),
    yamlPath: [...boundary.yamlPath!],
    rulePath: (boundary.rulePath ?? []).map(({ propertyKey }) => propertyKey),
    presentInSource: true,
    targetPaths: [...new Set(targetPaths)],
  }))

  const metadataSource = params.sources.find(({ role }) => role === "metadata")
  const metadataRoot = metadataSource?.document.roots.find(({ name }) => name === "MetaDataObject")
  const itemRoot = metadataRoot === undefined ? undefined : metadataItemRoot(metadataRoot, params.rule)
  if (metadataSource !== undefined && itemRoot !== undefined) {
    const existingYamlPaths = new Set(boundaries.map(({ yamlPath }) => JSON.stringify(yamlPath)))
    for (const planned of getYAMLToXMLPlan(params.rule).properties) {
      if (planned.propertyRule.filePath !== undefined || planned.xmlPath.at(-1)?.startsWith("_") === true) continue
      const yamlPath = [planned.yamlKey ?? planned.propertyKey]
      if (existingYamlPaths.has(JSON.stringify(yamlPath))) continue
      const xmlPath = appendElementPath(itemRoot.path, planned.xmlPath)
      if (elementsBySourcePath.get(metadataSource.sourcePath)?.has(xmlPath) === true) continue
      boundaries.push({
        sourcePath: metadataSource.sourcePath,
        sourceRole: metadataSource.role,
        xmlPath,
        yamlPath,
        rulePath: [planned.propertyKey],
        presentInSource: false,
      })
    }
  }
  return boundaries
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
  const elementsBySourcePath = new Map(
    params.sources.map((source) => [source.sourcePath, indexElements(source.document.roots)] as const),
  )
  const nodesBySourcePath = new Map(
    params.sources.map((source) => [source.sourcePath, indexAuditedNodes(source.document.roots)] as const),
  )
  const boundaries = params.boundaries.map((boundary) => {
    const source = sourceByPath.get(boundary.sourcePath)
    if (source === undefined) throw new Error(`Не найден XML-source для proof: ${boundary.sourcePath}`)
    if (!boundary.presentInSource) {
      return { ...boundary, targets: [], levels: [] }
    }
    const elements = elementsBySourcePath.get(boundary.sourcePath)!
    const nodes = nodesBySourcePath.get(boundary.sourcePath)!
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
    return { ...boundary, targets, levels }
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
    params.exported.map(({ document }) => [document, indexAuditedNodes(document.roots)] as const),
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
    rereadElements.set(sourcePath, indexElements(document.roots))
    rereadNodes.set(sourcePath, indexAuditedNodes(document.roots))
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
    if (exact || hasRawAtPath(annotationSnapshot, boundary.yamlPath)) continue

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
          const mergedComparison = indexElements(merged).get(comparison.xmlPath)
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

function hasRawAtPath(
  annotations: XmlAnomalyAnnotationsSnapshot,
  path: readonly (string | number)[],
): boolean {
  if (path.length === 0) return annotations.root?.kind === "raw"
  const parentPath = path.slice(0, -1)
  const key = path.at(-1)!
  return annotations.entries.some((entry) =>
    samePath(entry.parentPath, parentPath) &&
    entry.key === key &&
    entry.annotation.target === "value" &&
    entry.annotation.kind === "raw"
  )
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

function auditedSubtree(root: XmlElementNode): XmlImportAuditedNode[] {
  const result: XmlImportAuditedNode[] = [root, ...root.attributes]
  for (const child of root.content) {
    result.push(child)
    if (child.type === "element") result.push(...auditedSubtree(child).slice(1))
    if (child.type === "processingInstruction") result.push(...child.attributes)
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

function indexElements(roots: readonly XmlElementNode[]): ReadonlyMap<string, XmlElementNode> {
  const result = new Map<string, XmlElementNode>()
  const stack = [...roots]
  while (stack.length > 0) {
    const current = stack.pop()!
    result.set(current.path, current)
    for (const child of current.content) if (child.type === "element") stack.push(child)
  }
  return result
}

function indexAuditedNodes(
  roots: readonly XmlElementNode[],
): ReadonlyMap<string, XmlImportAuditedNode> {
  return new Map(roots.flatMap(auditedSubtree).map((node) => [node.path, node] as const))
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

function samePath(
  left: readonly (string | number)[],
  right: readonly (string | number)[],
): boolean {
  return left.length === right.length && startsWith(left, right)
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
