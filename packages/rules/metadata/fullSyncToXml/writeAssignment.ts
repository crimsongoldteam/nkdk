import fs from "node:fs"
import { dirname, join } from "node:path"
import { xmlExport } from "@nkdk/runtime"
import type { ConfigurationIndexBlockFragment } from "@nkdk/runtime"
import type { ConfigurationContext } from "@nkdk/runtime"
import { finalizeExportedXmlValues } from "../ruleRuntime/property/finalizeExportedXML"
import type { YAMLToXMLProfile } from "@nkdk/runtime/rule-kit"
import type {
  FullXmlSyncAssignment,
  FullXmlSyncDiagnostic,
  FullXmlSyncGeneratedDocument,
  FullXmlSyncOutputTarget,
  FullXmlSyncWrittenFile,
  PreparedXMLAssignment,
} from "./types"

interface PreparedWriteParams {
  readonly prepared: PreparedXMLAssignment
  readonly context: ConfigurationContext
  readonly outputTarget: FullXmlSyncOutputTarget
}

export interface WriteFullXmlSyncAssignmentResult {
  readonly diagnostics: readonly FullXmlSyncDiagnostic[]
  readonly writtenFiles: readonly FullXmlSyncWrittenFile[]
  readonly generatedDocuments: readonly FullXmlSyncGeneratedDocument[]
  readonly fragments: readonly ConfigurationIndexBlockFragment[]
  readonly profile?: YAMLToXMLProfile
}

export async function writeFullXmlSyncAssignment(
  params: PreparedWriteParams
): Promise<WriteFullXmlSyncAssignmentResult> {
  return writePreparedAssignment(params)
}

async function writePreparedAssignment(
  params: PreparedWriteParams
): Promise<WriteFullXmlSyncAssignmentResult> {
  const writtenFiles: FullXmlSyncWrittenFile[] = []
  const generatedDocuments: FullXmlSyncGeneratedDocument[] = []
  try {
    const requestedDocumentIds = requestedIds(params)
    const foundDocumentIds = new Set<string>()
    for (const document of params.prepared.documents) {
      finalizeExportedXmlValues({
        xml: document.xml,
        rootRule: document.rootRule,
        deferred: document.deferred,
        context: params.context,
      })
      const content = new TextEncoder().encode(xmlExport(document.xml))
      if (params.outputTarget.kind === "directory") {
        const target = join(params.outputTarget.outputDir, ...document.targetXmlPath.split("/"))
        await fs.promises.mkdir(dirname(target), { recursive: true })
        await fs.promises.writeFile(target, content)
        writtenFiles.push({
          assignmentId: params.prepared.assignment.id,
          targetXmlPath: document.targetXmlPath,
        })
      } else if (document.declarationId !== undefined && requestedDocumentIds.has(document.declarationId)) {
        foundDocumentIds.add(document.declarationId)
        generatedDocuments.push({
          assignmentId: params.prepared.assignment.id,
          declarationId: document.declarationId,
          targetXmlPath: document.targetXmlPath,
          content,
        })
      }
    }
    for (const declarationId of requestedDocumentIds) {
      if (!foundDocumentIds.has(declarationId)) {
        throw new Error(`Не сформирован запрошенный XML-документ: ${declarationId}`)
      }
    }
    return {
      diagnostics: [],
      writtenFiles,
      generatedDocuments,
      fragments: params.prepared.indexCollectors.map(({ collector, targetProjectPath }) =>
        collector.fragment(targetProjectPath)
      ),
      profile: params.prepared.profile,
    }
  } catch (caught) {
    return failedResult(params.prepared.assignment, caught, writtenFiles)
  }
}

function failedResult(
  assignment: FullXmlSyncAssignment,
  caught: unknown,
  writtenFiles: readonly FullXmlSyncWrittenFile[]
): WriteFullXmlSyncAssignmentResult {
  return {
    diagnostics: [
      assignmentDiagnostic(
        assignment,
        "full_xml_sync_assignment_failed",
        caught instanceof Error ? caught.message : String(caught)
      ),
    ],
    writtenFiles,
    generatedDocuments: [],
    fragments: [],
  }
}

function requestedIds(params: PreparedWriteParams): ReadonlySet<string> {
  if (params.outputTarget.kind === "directory") return new Set()
  return new Set(params.outputTarget.documentIdsByAssignment[params.prepared.assignment.id] ?? [])
}

function assignmentDiagnostic(
  assignment: FullXmlSyncAssignment,
  code: string,
  message: string
): FullXmlSyncDiagnostic {
  return {
    severity: "error",
    code,
    message,
    assignmentId: assignment.id,
    sourceProjectPath: assignment.sourceProjectPath,
    sourcePath: assignment.sourcePath,
    targetXmlPath: assignment.potentialOutputs[0]?.targetXmlPath,
  }
}
