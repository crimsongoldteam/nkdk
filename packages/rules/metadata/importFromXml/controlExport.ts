import {
  parseXmlDocumentWithSaxes,
  restoreXmlAnomalyAnnotations,
  type ConfigurationContextWithExportToXML,
  type LocalConfigurationIndexReader,
  type XmlAnomalyAnnotationsSnapshot,
  type XmlImportConfigurationContext,
} from "@nkdk/runtime"
import type { CompiledMetadataResourceTopology } from "@nkdk/runtime/rule-kit"
import { buildPreparedAssignmentXml } from "../fullSyncToXml/xmlAnomalyAssignment"
import { prepareFullXmlSyncAssignment } from "../fullSyncToXml/prepareAssignment"
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
  readonly topology: CompiledMetadataResourceTopology
  readonly context: XmlImportConfigurationContext
  readonly index: LocalConfigurationIndexReader
  readonly composition: MetadataXmlPrepareComposition
  readonly readSource: (sourcePath: string) => Promise<string>
  readonly ordinaryExporter?: typeof prepareFullXmlSyncAssignment
}): Promise<ProveXmlAnomalyBoundariesResult> {
  if (params.annotations.root?.kind === "raw") {
    return {
      data: params.data,
      annotations: params.annotations,
      rereadSourcePaths: [],
    }
  }
  const assignment = projectControlAssignment(params.assignment, params.topology)
  const context = controlExportContext(params.context)
  controlExportCountValueForTests += 1
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
    composition: params.composition,
    topology: params.topology,
    xmlAnomalyRawFallback: false,
  })
  const exported = prepared.documents.map((document) => {
    const output = assignment.potentialOutputs.find(
      ({ declarationId }) => declarationId === document.declarationId,
    )
    if (output === undefined) {
      throw new Error(`Не найдено описание контрольного XML-документа ${document.declarationId ?? "<unknown>"}`)
    }
    const source = matchSource(params.assignment.xmlFiles, output.role, output.targetXmlPath)
    const xml = buildPreparedAssignmentXml({
      document: { ...document, rawBoundaries: [] },
      context,
    })
    return {
      role: output.role,
      ...(source === undefined ? {} : { sourcePath: source.sourcePath }),
      document: parseXmlDocumentWithSaxes(xml, {
        preserveXsiNil: true,
        preserveEmptyElements: true,
      }),
    }
  })
  const result = await proveXmlAnomalyBoundaries({
    data: params.data,
    annotations: params.annotations,
    audit: params.audit,
    exported,
    readSource: params.readSource,
  })
  return result
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
): ConfigurationContextWithExportToXML {
  return {
    ...context,
    exportToXML: {
      ...(context.exportToXML ?? {}),
      componentKind: context.fromXML.componentKind,
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
