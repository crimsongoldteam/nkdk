import {
  applyXmlPatch,
  copyYAMLRuntimeMetadataDeep,
  createXmlAnomalyAnnotations,
  decodeXmlRawValue,
  restoreXmlAnomalyAnnotations,
  snapshotXmlAnomalyAnnotations,
  xmlElementRawValue,
  type ConfigurationContextWithExportToXML,
  type LocalConfigurationIndexReader,
  type XmlAnomalyAnnotationsSnapshot,
  type XmlDocument,
  type XmlElementNode,
  type XmlImportConfigurationContext,
  type XmlRawValue,
} from "@nkdk/runtime"
import type { CompiledMetadataResourceTopology, MetadataItemRule } from "@nkdk/runtime/rule-kit"
import { buildPreparedAssignmentControlDocument } from "../fullSyncToXml/xmlAnomalyAssignment"
import { prepareFullXmlSyncAssignment } from "../fullSyncToXml/prepareAssignment"
import type { BaseFormSourceResult } from "../fullSyncToXml/baseFormSource"
import type { FullXmlSyncAssignment } from "../fullSyncToXml/types"
import type { MetadataXmlPrepareComposition } from "../resourceTopology/adapters/capabilities"
import { classifyMetadataProjectPath } from "../resourceTopology/core/projectProjection"
import { projectXmlExportAssignment } from "../resourceTopology/core/xmlExportProjection"
import {
  proveXmlAnomalyBoundaries,
  type ProveXmlAnomalyBoundariesResult,
  type XmlAnomalyProofAudit,
} from "./anomalyProof"
import type { ImportAssignment, ImportXmlInput } from "./types"
import type { XmlComponentExportProfile } from "../project/xmlReconstructionProfile"

let controlExportCountValueForTests = 0

export function controlExportCountForTests(): number {
  return controlExportCountValueForTests
}

export function resetControlExportCountForTests(): void {
  controlExportCountValueForTests = 0
}

export async function executeImportControlExport(params: {
  readonly assignment: ImportAssignment
  readonly data: unknown
  readonly annotations: XmlAnomalyAnnotationsSnapshot
  readonly audit: XmlAnomalyProofAudit
  readonly rule?: MetadataItemRule
  readonly topology: CompiledMetadataResourceTopology
  readonly context: XmlImportConfigurationContext
  readonly exportProfile: XmlComponentExportProfile
  readonly index: LocalConfigurationIndexReader
  readonly baseConfigurationIndex?: LocalConfigurationIndexReader
  readonly baseFormSource?: BaseFormSourceResult
  readonly composition: MetadataXmlPrepareComposition
  readonly ordinaryExporter?: typeof prepareFullXmlSyncAssignment
  readonly controlDocumentBuilder?: typeof buildPreparedAssignmentControlDocument
  readonly profilePropertyTypes?: boolean
  readonly profile?: (event: {
    readonly mode: "direct" | "serialized"
    readonly toXmlObjectMs: number
    readonly toXmlFinalizeMs: number
    readonly directHashMs: number
    readonly mismatchDocumentMs: number
    readonly anomalyProofMs: number
    readonly propertyTypes: readonly {
      readonly propertyType: string
      readonly propertyCount: number
      readonly inclusiveMs: number
      readonly exclusiveMs: number
    }[]
    readonly fusedAtomicTypes: readonly {
      readonly propertyType: string
      readonly count: number
      readonly timeMs: number
    }[]
  }) => void
}): Promise<ProveXmlAnomalyBoundariesResult> {
  if (params.annotations.root?.kind === "raw") {
    return {
      data: params.data,
      annotations: params.annotations,
      rereadSourcePaths: [],
      warnings: [],
    }
  }
  const assignment = projectControlAssignment(params.assignment, params.topology)
  const context = controlExportContext(params.context, params.exportProfile)
  controlExportCountValueForTests += 1
  const toXmlObjectStartedAt = performance.now()
  const prepared = (params.ordinaryExporter ?? prepareFullXmlSyncAssignment)({
    assignment,
    preparedYamlFile: {
      projectPath: params.assignment.targetProjectPath,
      filePath: params.assignment.targetProjectPath,
      role: params.assignment.role === "fileItem" ? "form" : params.assignment.role,
      owner: {
        dir: params.assignment.targetProjectPath.split("/", 1)[0] ?? "",
        name: params.assignment.owner?.name ?? params.assignment.itemName,
      },
      data: params.data,
      // Proof обязан проверить обычный экспорт, поэтому raw fallback здесь намеренно отключён.
      // Обычный экспорт получает смысловую проекцию: существующий raw не
      // участвует в PropertyRule, а invalid/important остаются значениями.
      annotations: restoreXmlAnomalyAnnotations(params.data, params.annotations),
      syntaxDiagnostics: [],
    },
    context,
    index: params.index,
    ...(params.baseFormSource === undefined
      ? {}
      : {
          baseFormSource: params.baseFormSource,
          ...(params.baseConfigurationIndex === undefined
            ? {}
            : { baseConfigurationIndex: params.baseConfigurationIndex }),
        }),
    composition: params.composition,
    topology: params.topology,
    xmlAnomalyRawFallback: false,
    profilePropertyTypes: params.profilePropertyTypes,
  })
  const toXmlObjectMs = performance.now() - toXmlObjectStartedAt
  const semanticAnnotations = projectControlSemanticAnnotations({
    sourceData: params.data,
    sourceAnnotations: params.annotations,
    targetData: prepared.semanticYamlFile.data,
  })
  const preliminaryExported = prepared.documents.map((document) => {
    const output = assignment.potentialOutputs.find(
      ({ declarationId }) => declarationId === document.declarationId,
    )
    if (output === undefined) {
      throw new Error(`Не найдено описание контрольного XML-документа ${document.declarationId ?? "<unknown>"}`)
    }
    const source = matchSource(params.assignment.xmlFiles, output.role, output.targetXmlPath)
    const control = (params.controlDocumentBuilder ?? buildPreparedAssignmentControlDocument)({
      document: { ...document, rawBoundaries: [] },
      context,
      profile: prepared.profile,
    })
    return {
      role: output.role,
      ...(source === undefined ? {} : { sourcePath: source.sourcePath }),
      control,
      roots: control.roots,
    }
  })
  if (controlExportMatchesSourceRoots(params.audit, preliminaryExported)) {
    params.profile?.({
      mode: controlExportMode(preliminaryExported),
      ...controlExportTimings(prepared.profile, toXmlObjectMs, 0),
    })
    const retainImportedYaml = !hasRawXmlAnomaly(params.annotations)
    return {
      data: retainImportedYaml ? params.data : prepared.semanticYamlFile.data,
      annotations: retainImportedYaml
        ? params.annotations
        : snapshotXmlAnomalyAnnotations(
            prepared.semanticYamlFile.data,
            semanticAnnotations,
          ),
      rereadSourcePaths: [],
      warnings: [],
    }
  }
  const exported = preliminaryExported.map(({ role, sourcePath, control }) => ({
    role,
    ...(sourcePath === undefined ? {} : { sourcePath }),
    document: control.document(),
  }))
  const proofInput = retainUnownedImportRaw({
    data: prepared.semanticYamlFile.data,
    annotations: snapshotXmlAnomalyAnnotations(
      prepared.semanticYamlFile.data,
      semanticAnnotations,
    ),
    imported: {
      data: params.data,
      annotations: params.annotations,
      audit: params.audit,
    },
    exported,
  })
  const anomalyProofStartedAt = performance.now()
  const result = await proveXmlAnomalyBoundaries({
    data: proofInput.data,
    annotations: proofInput.annotations,
    audit: params.audit,
    rule: params.rule,
    exported,
  })
  const anomalyProofMs = performance.now() - anomalyProofStartedAt
  params.profile?.({
    mode: controlExportMode(preliminaryExported),
    ...controlExportTimings(prepared.profile, toXmlObjectMs, anomalyProofMs),
  })
  return result
}

function projectControlSemanticAnnotations(params: {
  readonly sourceData: unknown
  readonly sourceAnnotations: XmlAnomalyAnnotationsSnapshot
  readonly targetData: unknown
}) {
  const semanticSnapshot: XmlAnomalyAnnotationsSnapshot = {
    version: 1,
    ...(params.sourceAnnotations.root === undefined
      ? {}
      : params.sourceAnnotations.root.kind === "raw"
        ? params.sourceAnnotations.root.semantic === undefined
          ? {}
          : {
              root: {
                ...params.sourceAnnotations.root.semantic,
                target: "root" as const,
              },
            }
        : { root: params.sourceAnnotations.root }),
    entries: params.sourceAnnotations.entries.flatMap((entry) => {
      if (entry.annotation.kind !== "raw") return [entry]
      if (entry.annotation.semantic === undefined) return []
      return [{
        ...entry,
        annotation: {
          ...entry.annotation.semantic,
          target: entry.annotation.target,
          ...(entry.annotation.logicalKey === undefined ? {} : { logicalKey: entry.annotation.logicalKey }),
        },
      }]
    }),
  }
  const sourceAnnotations = restoreXmlAnomalyAnnotations(params.sourceData, semanticSnapshot)
  const targetAnnotations = createXmlAnomalyAnnotations()
  copyYAMLRuntimeMetadataDeep({
    source: params.sourceData,
    target: params.targetData,
    sourceAnnotations,
    targetAnnotations,
  })
  return targetAnnotations
}

function hasRawXmlAnomaly(annotations: XmlAnomalyAnnotationsSnapshot): boolean {
  return annotations.root?.kind === "raw"
    || annotations.entries.some(({ annotation }) => annotation.kind === "raw")
}

function controlExportTimings(
  profile: {
    readonly propertyConversionMs: number
    readonly deferredFinalizeMs: number
    readonly directHashMs: number
    readonly mismatchDocumentMs: number
    readonly propertyTypeProfiles: Readonly<Record<string, {
      readonly propertyCount: number
      readonly inclusiveMs: number
      readonly exclusiveMs: number
    }>>
    readonly fusedAtomicByType: ReadonlyMap<string, { readonly count: number; readonly timeMs: number }>
  },
  toXmlObjectMs: number,
  anomalyProofMs: number,
) {
  return {
    toXmlObjectMs,
    toXmlFinalizeMs: profile.deferredFinalizeMs,
    directHashMs: profile.directHashMs,
    mismatchDocumentMs: profile.mismatchDocumentMs,
    anomalyProofMs,
    propertyTypes: Object.entries(profile.propertyTypeProfiles).map(([propertyType, value]) => ({
      propertyType,
      ...value,
    })),
    fusedAtomicTypes: [...profile.fusedAtomicByType].map(([propertyType, value]) => ({
      propertyType,
      ...value,
    })),
  }
}

function retainUnownedImportRaw(params: {
  readonly data: unknown
  readonly annotations: XmlAnomalyAnnotationsSnapshot
  readonly imported: {
    readonly data: unknown
    readonly annotations: XmlAnomalyAnnotationsSnapshot
    readonly audit: XmlAnomalyProofAudit
  }
  readonly exported: readonly {
    readonly role: ImportXmlInput["role"]
    readonly sourcePath?: string
    readonly document: XmlDocument
  }[]
}): { readonly data: unknown; readonly annotations: XmlAnomalyAnnotationsSnapshot } {
  const exportedIndexes = params.exported.map((candidate) => ({
    ...candidate,
    elementsByFinalName: indexDocumentElementsByFinalName(candidate.document.roots),
  }))
  const ownedYamlPaths = new Set(
    params.imported.audit.boundaries.flatMap((boundary) => [
      JSON.stringify(boundary.yamlPath),
      ...boundary.levels.flatMap((level) =>
        level.rawYamlPath === undefined ? [] : [JSON.stringify(level.rawYamlPath)]
      ),
    ]),
  )
  const claimedElementNames = new Set(
    params.imported.audit.boundaries.flatMap((boundary) => [
      ...boundary.levels.flatMap((level) => [level.elementName, xmlLocalName(level.elementName)]),
      ...boundary.targets.flatMap(({ path }) => {
        const name = xmlElementNameFromPath(path)
        return name === undefined ? [] : [name, xmlLocalName(name)]
      }),
    ]),
  )
  const retained = params.imported.annotations.entries.filter((entry) => {
    if (entry.annotation.kind !== "raw") return false
    if (typeof entry.key !== "string" || (!entry.key.includes("\\") && !entry.key.startsWith("@"))) {
      return false
    }
    if (rawEntryMatchesOrdinaryExport(entry.key, entry.annotation.xml, exportedIndexes)) return false
    const finalXmlName = entry.key.split("\\").at(-1)!
    if (claimedElementNames.has(finalXmlName) || claimedElementNames.has(xmlLocalName(finalXmlName))) return false
    return !ownedYamlPaths.has(JSON.stringify([...entry.parentPath, entry.key]))
  })
  if (retained.length === 0) return params
  for (const entry of retained) {
    const path = [...entry.parentPath, entry.key]
    setValueAtPath(params.data, path, valueAtPath(params.imported.data, path))
  }
  const retainedPaths = new Set(retained.map((entry) => JSON.stringify([...entry.parentPath, entry.key])))
  return {
    data: params.data,
    annotations: {
      version: 1,
      ...(params.annotations.root === undefined ? {} : { root: params.annotations.root }),
      entries: [
        ...params.annotations.entries.filter((entry) =>
          !retainedPaths.has(JSON.stringify([...entry.parentPath, entry.key]))
        ),
        ...retained,
      ],
    },
  }
}

function valueAtPath(root: unknown, path: readonly (string | number)[]): unknown {
  let value = root
  for (const segment of path) {
    if (value === null || typeof value !== "object") return undefined
    value = (value as Record<string | number, unknown>)[segment]
  }
  return value
}

function setValueAtPath(root: unknown, path: readonly (string | number)[], value: unknown): void {
  let parent = root
  for (let index = 0; index < path.length - 1; index += 1) {
    const segment = path[index]!
    if (parent === null || typeof parent !== "object") {
      throw new Error(`Не найдена YAML-граница подробного raw: /${path.join("/")}`)
    }
    const record = parent as Record<string | number, unknown>
    record[segment] ??= typeof path[index + 1] === "number" ? [] : {}
    parent = record[segment]
  }
  if (parent === null || typeof parent !== "object" || path.length === 0) {
    throw new Error(`Не найдена YAML-граница подробного raw: /${path.join("/")}`)
  }
  ;(parent as Record<string | number, unknown>)[path.at(-1)!] = value
}

function xmlLocalName(name: string): string {
  return name.split(":").at(-1) ?? name
}

function xmlElementNameFromPath(path: string): string | undefined {
  return /(?:^|\\)([^\\[]+)\[\d+\]$/u.exec(path)?.[1]
}

function rawEntryMatchesOrdinaryExport(
  key: string,
  xml: XmlRawValue | undefined,
  exported: readonly {
    readonly role: ImportXmlInput["role"]
    readonly sourcePath?: string
    readonly elementsByFinalName: ReadonlyMap<
      string,
      readonly { readonly node: XmlElementNode; readonly path: readonly string[] }[]
    >
  }[],
): boolean {
  if (xml === undefined || xml === null) return false
  const { selector, segments } = splitPublicRawPath(key)
  if (segments.length === 0) return false
  return exported.some((candidate) => {
    if (!matchesDocumentSelector(candidate, selector)) return false
    return (candidate.elementsByFinalName.get(segments.at(-1)!) ?? []).some(({ node, path }) =>
      hasPathSuffix(path, segments) && rawPatchLeavesElementUnchanged(node, xml)
    )
  })
}

function rawPatchLeavesElementUnchanged(node: XmlElementNode, patch: XmlRawValue): boolean {
  const ordinary = xmlElementRawValue(node)
  if (ordinary === null) return false
  try {
    const merged = applyXmlPatch(ordinary, patch)
    const decoded = decodeXmlRawValue(merged, { elementName: node.name }).nodes[0]
    return decoded?.structuralHash === node.structuralHash
  } catch {
    return false
  }
}

function splitPublicRawPath(key: string): { readonly selector?: string; readonly segments: string[] } {
  if (!key.startsWith("@")) return { segments: key.split("\\") }
  const separator = key.indexOf("\\")
  if (separator < 0) return { selector: key.slice(1), segments: [] }
  return { selector: key.slice(1, separator), segments: key.slice(separator + 1).split("\\") }
}

function matchesDocumentSelector(
  candidate: { readonly role: ImportXmlInput["role"]; readonly sourcePath?: string },
  selector: string | undefined,
): boolean {
  if (selector === undefined) return true
  if (selector.length === 0) return candidate.role === "metadata"
  const fileName = candidate.sourcePath?.replaceAll("\\", "/").split("/").at(-1)
  return fileName === `${selector}.xml`
}

function indexDocumentElementsByFinalName(
  roots: readonly XmlElementNode[],
): ReadonlyMap<string, readonly { readonly node: XmlElementNode; readonly path: readonly string[] }[]> {
  const result = new Map<string, { node: XmlElementNode; path: readonly string[] }[]>()
  const pending = roots.map((node) => ({ node, path: [node.name] as readonly string[] }))
  while (pending.length > 0) {
    const current = pending.pop()!
    const matching = result.get(current.node.name)
    if (matching === undefined) result.set(current.node.name, [current])
    else matching.push(current)
    for (const child of current.node.content) {
      if (child.type === "element") pending.push({ node: child, path: [...current.path, child.name] })
    }
  }
  return result
}

function hasPathSuffix(path: readonly string[], suffix: readonly string[]): boolean {
  if (suffix.length > path.length) return false
  const offset = path.length - suffix.length
  return suffix.every((segment, index) => path[offset + index] === segment)
}

function controlExportMode(
  exported: readonly { readonly control: { readonly mode: "direct" | "serialized" } }[],
): "direct" | "serialized" {
  return exported.every(({ control }) => control.mode === "direct") ? "direct" : "serialized"
}

function controlExportMatchesSourceRoots(
  audit: XmlAnomalyProofAudit,
  exported: readonly {
    readonly role: ImportXmlInput["role"]
    readonly sourcePath?: string
    readonly roots: readonly { readonly path: string; readonly structuralHash: bigint }[]
  }[],
): boolean {
  if (audit.sources.length !== exported.length) return false
  return audit.sources.every((source) => {
    const roleMatches = exported.filter((candidate) => candidate.role === source.role)
    const exactMatches = roleMatches.filter((candidate) => candidate.sourcePath === source.sourcePath)
    const hasSourceIdentity = roleMatches.some(({ sourcePath }) => sourcePath !== undefined)
    const matches = hasSourceIdentity ? exactMatches : roleMatches
    if (matches.length !== 1) return false
    const roots = matches[0]!.roots
    if (roots.length !== source.roots.length) return false
    const rootsByPath = new Map(roots.map((root) => [root.path, root] as const))
    return source.roots.every(({ xmlPath, structuralHash }) =>
      rootsByPath.get(xmlPath)?.structuralHash === structuralHash
    )
  })
}

function projectControlAssignment(
  assignment: ImportAssignment,
  topology: CompiledMetadataResourceTopology,
): FullXmlSyncAssignment {
  const match = classifyMetadataProjectPath(topology, assignment.targetProjectPath)
  if (match?.kind !== "content") {
    throw new Error(`Не найден content topology для контрольного экспорта ${assignment.targetProjectPath}`)
  }
  const projected = projectXmlExportAssignment(topology, match)
  if (projected.itemType !== assignment.itemType || projected.logicalAddress !== assignment.logicalAddress) {
    throw new Error(`Topology контрольного экспорта не соответствует import assignment ${assignment.id}`)
  }
  const { assignmentRole, itemType, itemName, logicalAddress, owner, nodeId } = projected
  const potentialOutputs = projected.potentialOutputs.filter((output) =>
    matchSource(assignment.xmlFiles, output.role, output.targetXmlPath) !== undefined
  )
  return {
    id: assignment.id,
    sourceProjectPath: assignment.targetProjectPath,
    sourcePath: assignment.targetProjectPath,
    expectedContentHash: 0n,
    role: assignmentRole === "fileItem" ? "form" : assignmentRole,
    itemType,
    itemName,
    logicalAddress,
    ...(owner === undefined ? {} : { owner }),
    nodeId,
    potentialOutputs,
  }
}

function controlExportContext(
  context: XmlImportConfigurationContext,
  profile: XmlComponentExportProfile,
): ConfigurationContextWithExportToXML {
  return {
    ...context,
    exportToXML: {
      ...(context.exportToXML ?? {}),
      componentKind: profile.componentKind,
      adoptedUuids: profile.adoptedUuids,
      designTimeReferenceByUuid: profile.designTimeReferenceByUuid,
      xmlDefaultVariantByLogicalAddress: profile.xmlDefaultVariantByLogicalAddress,
      ...(profile.typeDescriptionXMLNameByType === undefined
        ? {}
        : { typeDescriptionXMLNameByType: profile.typeDescriptionXMLNameByType }),
      version: context.exportToXML?.version ?? context.version,
      itemsTree: context.exportToXML?.itemsTree ?? [],
      context: {
        metadataForNumbering: [],
        forms: [],
        templates: [],
        parentName: "",
        ...context.exportToXML?.context,
      },
    },
  }
}

function matchSource(
  sources: readonly ImportXmlInput[],
  role: ImportXmlInput["role"],
  targetXmlPath: string,
): ImportXmlInput | undefined {
  const candidates = sources.filter((source) => source.role === role)
  if (role !== "property" && candidates.length === 1) return candidates[0]
  const normalizedTarget = targetXmlPath.replaceAll("\\", "/")
  const matches = candidates.filter(({ sourcePath }) => {
    const normalizedSource = sourcePath.replaceAll("\\", "/")
    return normalizedSource === normalizedTarget
      || normalizedSource.endsWith(`/${normalizedTarget}`)
  })
  return matches.length === 1 ? matches[0] : undefined
}
