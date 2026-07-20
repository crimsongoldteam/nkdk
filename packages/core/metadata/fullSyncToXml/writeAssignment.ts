import { join } from "node:path"
import { createConfigurationIndexCollector } from "../configurationIndex/collector/writer"
import { createConfigurationIndexExportRuntime } from "../configurationIndex/exportRuntime"
import type { ConfigurationIndexReader } from "../configurationIndex/sharedSnapshot"
import type { ConfigurationIndexFragment } from "../configurationIndex/types"
import type { ConfigurationContextWithExportToXML } from "../context/types"
import type { PreparedYamlFile } from "../project/preparedYamlProject"
import { getMetadataProjectSpecByDir } from "../project/specs"
import { writePreparedAppliedObjectOwnerToXML } from "../orchestration/appliedObject/syncToXML"
import type { FullXmlSyncAssignment, FullXmlSyncDiagnostic, FullXmlSyncWrittenFile } from "./types"

export interface WriteFullXmlSyncAssignmentParams {
  readonly assignment: FullXmlSyncAssignment
  readonly preparedYamlFile: PreparedYamlFile
  readonly context: ConfigurationContextWithExportToXML
  readonly outputDir: string
  readonly index: ConfigurationIndexReader
}

export interface WriteFullXmlSyncAssignmentResult {
  readonly diagnostics: readonly FullXmlSyncDiagnostic[]
  readonly writtenFiles: readonly FullXmlSyncWrittenFile[]
  readonly fragment?: ConfigurationIndexFragment
}

export async function writeFullXmlSyncAssignment(
  params: WriteFullXmlSyncAssignmentParams
): Promise<WriteFullXmlSyncAssignmentResult> {
  const collector = createConfigurationIndexCollector()
  const runtime = createConfigurationIndexExportRuntime({
    source: params.index,
    collector,
    targetProjectPath: params.assignment.sourceProjectPath,
    logicalAddress: params.assignment.logicalAddress,
  })
  const context: ConfigurationContextWithExportToXML = {
    ...params.context,
    exportToXML: {
      ...params.context.exportToXML,
      configurationIndex: runtime,
    },
  }

  try {
    const ownerOutput = params.assignment.outputs.find((output) => output.routeKind === "owner")
    if (ownerOutput === undefined) {
      return {
        diagnostics: [assignmentDiagnostic(params.assignment, "full_xml_sync_no_owner_output", "У задания нет owner XML-выхода")],
        writtenFiles: [],
      }
    }

    const rule = metadataRuleForAssignment(params.assignment)
    if (rule === undefined) {
      return {
        diagnostics: [
          assignmentDiagnostic(params.assignment, "full_xml_sync_rule_not_found", "Не найдено правило структуры проекта для задания"),
        ],
        writtenFiles: [],
      }
    }

    await writePreparedAppliedObjectOwnerToXML({
      rule,
      context,
      name: params.assignment.itemName,
      outputPath: join(params.outputDir, ...ownerOutput.targetXmlPath.split("/")),
      preparedYamlFile: params.preparedYamlFile,
    })

    return {
      diagnostics: [],
      writtenFiles: [{ assignmentId: params.assignment.id, targetXmlPath: ownerOutput.targetXmlPath }],
      fragment: collector.fragment(params.assignment.sourceProjectPath),
    }
  } catch (caught) {
    return {
      diagnostics: [assignmentDiagnostic(params.assignment, "full_xml_sync_assignment_failed", errorMessage(caught))],
      writtenFiles: [],
    }
  }
}

function metadataRuleForAssignment(assignment: FullXmlSyncAssignment) {
  const ownerDir = assignment.sourceProjectPath.split("/")[0] ?? ""
  return getMetadataProjectSpecByDir(ownerDir)?.rule
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

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
