import fs from "node:fs"
import { dirname, join, posix } from "node:path"
import { createConfigurationIndexCollector } from "../configurationIndex/collector/writer"
import { createConfigurationIndexExportRuntime } from "../configurationIndex/exportRuntime"
import type { ConfigurationIndexReader } from "../configurationIndex/sharedSnapshot"
import type { ConfigurationIndexFragment } from "../configurationIndex/types"
import type { ConfigurationContextWithExportToXML } from "../context/types"
import type { PreparedYamlFile } from "../project/preparedYamlProject"
import { getMetadataProjectSpecByDir } from "../project/specs"
import { buildConfigurationChildObjectsFromProjectEntries } from "../appliedObjects/configuration/childObjects"
import { writePreparedConfigurationToXML } from "../appliedObjects/configuration/rootIO"
import { writePreparedFormToXML } from "../forms/clientApplicationForm/syncToXML"
import { writePreparedAppliedObjectOwnerToXML } from "../orchestration/appliedObject/syncToXML"
import type { FullXmlSyncAssignment, FullXmlSyncDiagnostic, FullXmlSyncWrittenFile } from "./types"

export interface WriteFullXmlSyncAssignmentParams {
  readonly assignment: FullXmlSyncAssignment
  readonly preparedYamlFile: PreparedYamlFile
  readonly context: ConfigurationContextWithExportToXML
  readonly outputDir: string
  readonly index: ConfigurationIndexReader
  readonly assignments?: readonly FullXmlSyncAssignment[]
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
    const outputDiagnostic = missingOutputDiagnostic(params.assignment)
    if (outputDiagnostic !== undefined) return { diagnostics: [outputDiagnostic], writtenFiles: [] }

    const writtenFiles = await writeAssignmentXML({ ...params, context })

    return {
      diagnostics: [],
      writtenFiles,
      fragment: collector.fragment(params.assignment.sourceProjectPath),
    }
  } catch (caught) {
    return {
      diagnostics: [assignmentDiagnostic(params.assignment, "full_xml_sync_assignment_failed", errorMessage(caught))],
      writtenFiles: [],
    }
  }
}

async function writeAssignmentXML(
  params: WriteFullXmlSyncAssignmentParams & { context: ConfigurationContextWithExportToXML }
): Promise<FullXmlSyncWrittenFile[]> {
  if (params.assignment.role === "configuration") return writeConfigurationAssignmentXML(params)
  if (params.assignment.role === "form") return writeFormAssignmentXML(params)
  return writePropertiesAssignmentXML(params)
}

async function writeConfigurationAssignmentXML(
  params: WriteFullXmlSyncAssignmentParams & { context: ConfigurationContextWithExportToXML }
): Promise<FullXmlSyncWrittenFile[]> {
  const output = params.assignment.outputs.find((item) => item.routeKind === "owner")
  if (output === undefined) throw new Error("У задания нет owner XML-выхода")

  writePreparedConfigurationToXML({
    context: params.context,
    outputDir: params.outputDir,
    preparedYamlFile: params.preparedYamlFile,
    childObjects: buildConfigurationChildObjectsFromProjectEntries({
      entries: (params.assignments ?? []).flatMap((assignment) =>
        assignment.role === "properties" ? [ownerEntryFromAssignment(assignment)] : []
      ),
    }),
  })
  return [{ assignmentId: params.assignment.id, targetXmlPath: output.targetXmlPath }]
}

async function writeFormAssignmentXML(
  params: WriteFullXmlSyncAssignmentParams & { context: ConfigurationContextWithExportToXML }
): Promise<FullXmlSyncWrittenFile[]> {
  const output = params.assignment.outputs.find((item) => item.routeKind === "fileItem")
  if (output === undefined) throw new Error("У задания нет fileItem XML-выхода")

  const ownerXmlDir = ownerXmlOutputDir(params.outputDir, output.targetXmlPath, params.assignment.itemName)
  await writePreparedFormToXML({
    context: params.context,
    preparedYamlFile: params.preparedYamlFile,
    formName: params.assignment.itemName,
    outputDir: ownerXmlDir,
    currentXMLPath: formBodyXmlPath(output.targetXmlPath, params.assignment.itemName),
  })
  const metadataPath = join(params.outputDir, ...output.targetXmlPath.split("/"))
  const bodyPath = join(ownerXmlDir, "Forms", params.assignment.itemName, "Ext", "Form.xml")
  return [
    { assignmentId: params.assignment.id, targetXmlPath: output.targetXmlPath },
    ...(fs.existsSync(bodyPath)
      ? [
          {
            assignmentId: params.assignment.id,
            targetXmlPath: posix.join(posix.dirname(output.targetXmlPath), params.assignment.itemName, "Ext", "Form.xml"),
          },
        ]
      : []),
  ].filter((file) => fs.existsSync(file.targetXmlPath === output.targetXmlPath ? metadataPath : bodyPath))
}

async function writePropertiesAssignmentXML(
  params: WriteFullXmlSyncAssignmentParams & { context: ConfigurationContextWithExportToXML }
): Promise<FullXmlSyncWrittenFile[]> {
  const ownerOutput = params.assignment.outputs.find((output) => output.routeKind === "owner")
  if (ownerOutput === undefined) throw new Error("У задания нет owner XML-выхода")

  const rule = metadataRuleForAssignment(params.assignment)
  if (rule === undefined) throw new Error("Не найдено правило структуры проекта для задания")

  await writePreparedAppliedObjectOwnerToXML({
    rule,
    context: params.context,
    name: params.assignment.itemName,
    outputPath: join(params.outputDir, ...ownerOutput.targetXmlPath.split("/")),
    preparedYamlFile: params.preparedYamlFile,
    fileChildNames: fileChildNamesForOwner(params.assignment, params.assignments ?? []),
  })
  return [{ assignmentId: params.assignment.id, targetXmlPath: ownerOutput.targetXmlPath }]
}

function metadataRuleForAssignment(assignment: FullXmlSyncAssignment) {
  const ownerDir = assignment.sourceProjectPath.split("/")[0] ?? ""
  return getMetadataProjectSpecByDir(ownerDir)?.rule
}

function ownerEntryFromAssignment(assignment: FullXmlSyncAssignment): { dir: string; name: string } {
  const parts = assignment.sourceProjectPath.split("/")
  return { dir: parts[0] ?? "", name: parts[1] ?? assignment.itemName }
}

function fileChildNamesForOwner(
  ownerAssignment: FullXmlSyncAssignment,
  assignments: readonly FullXmlSyncAssignment[]
): { forms?: string[]; templates?: string[] } {
  const forms = assignments
    .filter((assignment) => assignment.role === "form" && assignment.owner?.logicalAddress === ownerAssignment.logicalAddress)
    .map((assignment) => assignment.itemName)
  return forms.length === 0 ? {} : { forms }
}

function ownerXmlOutputDir(outputDir: string, targetXmlPath: string, formName: string): string {
  const suffix = posix.join("Forms", `${formName}.xml`)
  const ownerPath = targetXmlPath.endsWith(suffix) ? targetXmlPath.slice(0, -suffix.length).replace(/\/$/, "") : dirname(targetXmlPath)
  return ownerPath.length === 0 ? outputDir : join(outputDir, ...ownerPath.split("/"))
}

function formBodyXmlPath(metadataXmlPath: string, formName: string): string {
  return posix.join(posix.dirname(metadataXmlPath), formName, "Ext", "Form.xml")
}

function missingOutputDiagnostic(assignment: FullXmlSyncAssignment): FullXmlSyncDiagnostic | undefined {
  if (assignment.role === "form") {
    return assignment.outputs.some((output) => output.routeKind === "fileItem")
      ? undefined
      : assignmentDiagnostic(assignment, "full_xml_sync_no_file_item_output", "У задания нет fileItem XML-выхода")
  }

  return assignment.outputs.some((output) => output.routeKind === "owner")
    ? undefined
    : assignmentDiagnostic(assignment, "full_xml_sync_no_owner_output", "У задания нет owner XML-выхода")
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
