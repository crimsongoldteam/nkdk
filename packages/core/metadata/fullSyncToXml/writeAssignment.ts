import fs from "node:fs"
import { dirname, join } from "node:path"
import { xmlExport } from "../../xml/export/exporter"
import type { ConfigurationIndexFragment } from "../configurationIndex/types"
import type { ConfigurationContext } from "../context/types"
import { finalizeExportedXmlValues } from "../orchestration/property/finalizeExportedXML"
import type { YAMLToXMLProfile } from "../orchestration/property/fromYAMLToXMLTypes"
import type {
  FullXmlSyncAssignment,
  FullXmlSyncDiagnostic,
  FullXmlSyncWrittenFile,
  PreparedXMLAssignment,
} from "./types"

interface PreparedWriteParams {
  readonly prepared: PreparedXMLAssignment
  readonly context: ConfigurationContext
  readonly outputDir: string
}

export interface WriteFullXmlSyncAssignmentResult {
  readonly diagnostics: readonly FullXmlSyncDiagnostic[]
  readonly writtenFiles: readonly FullXmlSyncWrittenFile[]
  readonly fragment?: ConfigurationIndexFragment
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
  try {
    for (const document of params.prepared.documents) {
      finalizeExportedXmlValues({
        xml: document.xml,
        rootRule: document.rootRule,
        deferred: document.deferred,
        context: params.context,
      })
      const target = join(params.outputDir, ...document.targetXmlPath.split("/"))
      await fs.promises.mkdir(dirname(target), { recursive: true })
      await fs.promises.writeFile(target, xmlExport(document.xml), "utf-8")
      writtenFiles.push({
        assignmentId: params.prepared.assignment.id,
        targetXmlPath: document.targetXmlPath,
      })
    }
    return {
      diagnostics: [],
      writtenFiles,
      fragment: params.prepared.indexCollector.fragment(params.prepared.assignment.sourceProjectPath),
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
  }
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
