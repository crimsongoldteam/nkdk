import fs from "node:fs"
import { dirname, join } from "node:path"
import { xmlExport } from "../../xml/export/exporter"
import type { ConfigurationIndexReader } from "../configurationIndex/sharedSnapshot"
import type { ConfigurationIndexFragment } from "../configurationIndex/types"
import type { ConfigurationContext, ConfigurationContextWithExportToXML } from "../context/types"
import { finalizeExportedXmlValues } from "../orchestration/property/finalizeExportedXML"
import type { YAMLToXMLProfile } from "../orchestration/property/fromYAMLToXMLTypes"
import type { PreparedYamlFile } from "../project/preparedYamlProject"
import { prepareFullXmlSyncAssignment } from "./prepareAssignment"
import type { FullXmlSyncCompositionEntry } from "./sharedMetadata"
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

interface LegacyWriteParams {
  readonly assignment: FullXmlSyncAssignment
  readonly preparedYamlFile: PreparedYamlFile
  readonly context: ConfigurationContextWithExportToXML
  readonly outputDir: string
  readonly index: ConfigurationIndexReader
  readonly assignments?: readonly FullXmlSyncCompositionEntry[]
}

export interface WriteFullXmlSyncAssignmentResult {
  readonly diagnostics: readonly FullXmlSyncDiagnostic[]
  readonly writtenFiles: readonly FullXmlSyncWrittenFile[]
  readonly fragment?: ConfigurationIndexFragment
  readonly profile?: YAMLToXMLProfile
}

export async function writeFullXmlSyncAssignment(
  params: PreparedWriteParams | LegacyWriteParams
): Promise<WriteFullXmlSyncAssignmentResult> {
  if (!("prepared" in params)) {
    const outputDiagnostic = missingOutputDiagnostic(params.assignment)
    if (outputDiagnostic !== undefined) return { diagnostics: [outputDiagnostic], writtenFiles: [] }
    try {
      return writePreparedAssignment({
        prepared: prepareFullXmlSyncAssignment(params),
        context: params.context,
        outputDir: params.outputDir,
      })
    } catch (caught) {
      return failedResult(params.assignment, caught, [])
    }
  }
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

function missingOutputDiagnostic(assignment: FullXmlSyncAssignment): FullXmlSyncDiagnostic | undefined {
  const routeKind = assignment.role === "form" ? "fileItem" : "owner"
  return assignment.outputs.some((output) => output.routeKind === routeKind)
    ? undefined
    : assignmentDiagnostic(
        assignment,
        assignment.role === "form" ? "full_xml_sync_no_file_item_output" : "full_xml_sync_no_owner_output",
        `У задания нет ${routeKind} XML-выхода`
      )
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
    targetXmlPath: assignment.outputs[0]?.targetXmlPath,
  }
}
