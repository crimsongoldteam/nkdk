import { posix } from "node:path"
import { buildConfigurationChildObjectsFromProjectEntries } from "../appliedObjects/configuration/childObjects"
import { prepareConfigurationXML } from "../appliedObjects/configuration/rootIO"
import { createConfigurationIndexCollector } from "../configurationIndex/collector/writer"
import { createConfigurationIndexExportRuntime } from "../configurationIndex/exportRuntime"
import type { ConfigurationIndexReader } from "../configurationIndex/sharedSnapshot"
import type { ConfigurationContextWithExportToXML } from "../context/types"
import { prepareFormXML } from "../forms/clientApplicationForm/syncToXML"
import { prepareAppliedObjectOwnerXML } from "../orchestration/appliedObject/syncToXML"
import { createYAMLToXMLProfile } from "../orchestration/property/fromYAMLToXMLTypes"
import type { PreparedYamlFile } from "../project/preparedYamlProject"
import { getMetadataProjectSpecByDir } from "../project/specs"
import type { FullXmlSyncCompositionEntry } from "./sharedMetadata"
import type {
  FullXmlSyncAssignment,
  PreparedXMLAssignment,
  PreparedXMLDocument,
} from "./types"

export function prepareFullXmlSyncAssignment(params: {
  assignment: FullXmlSyncAssignment
  preparedYamlFile: PreparedYamlFile
  context: ConfigurationContextWithExportToXML
  index: ConfigurationIndexReader
  assignments?: readonly FullXmlSyncCompositionEntry[]
}): PreparedXMLAssignment {
  const indexCollector = createConfigurationIndexCollector()
  const runtime = createConfigurationIndexExportRuntime({
    source: params.index,
    collector: indexCollector,
    targetProjectPath: params.assignment.sourceProjectPath,
    logicalAddress: params.assignment.logicalAddress,
  })
  const context: ConfigurationContextWithExportToXML = {
    ...params.context,
    exportToXML: { ...params.context.exportToXML, configurationIndex: runtime },
  }
  const profile = createYAMLToXMLProfile()
  const documents = prepareAssignmentDocuments({ ...params, context, profile })
  return { assignment: params.assignment, documents, indexCollector, profile }
}

function prepareAssignmentDocuments(
  params: Parameters<typeof prepareFullXmlSyncAssignment>[0] & {
    context: ConfigurationContextWithExportToXML
    profile: ReturnType<typeof createYAMLToXMLProfile>
  }
): readonly PreparedXMLDocument[] {
  if (params.assignment.role === "configuration") {
    const output = requireOutput(params.assignment, "owner")
    const prepared = prepareConfigurationXML({
      context: params.context,
      preparedYamlFile: params.preparedYamlFile,
      childObjects: buildConfigurationChildObjectsFromProjectEntries({
        entries: (params.assignments ?? []).flatMap((assignment) =>
          assignment.role === "properties" ? [ownerEntryFromAssignment(assignment)] : []
        ),
      }),
      profile: params.profile,
    })
    return [{ targetXmlPath: output.targetXmlPath, ...prepared }]
  }

  if (params.assignment.role === "form") {
    const output = requireOutput(params.assignment, "fileItem")
    return prepareFormXML({
      context: params.context,
      preparedYamlFile: params.preparedYamlFile,
      formName: params.assignment.itemName,
      currentXMLPath: formBodyXmlPath(output.targetXmlPath, params.assignment.itemName),
      profile: params.profile,
    }).map((document) => ({
      targetXmlPath:
        document.targetKind === "metadata"
          ? output.targetXmlPath
          : formBodyXmlPath(output.targetXmlPath, params.assignment.itemName),
      xml: document.xml,
      deferred: document.deferred,
      rootRule: document.rootRule,
    }))
  }

  const output = requireOutput(params.assignment, "owner")
  const rule = metadataRuleForAssignment(params.assignment)
  if (rule === undefined) throw new Error("Не найдено правило структуры проекта для задания")
  const prepared = prepareAppliedObjectOwnerXML({
    rule,
    context: params.context,
    name: params.assignment.itemName,
    preparedYamlFile: params.preparedYamlFile,
    fileChildNames: fileChildNamesForOwner(params.assignment, params.assignments ?? []),
    profile: params.profile,
  })
  return [{ targetXmlPath: output.targetXmlPath, ...prepared }]
}

function requireOutput(assignment: FullXmlSyncAssignment, routeKind: "owner" | "fileItem") {
  const output = assignment.outputs.find((candidate) => candidate.routeKind === routeKind)
  if (output === undefined) throw new Error(`У задания нет ${routeKind} XML-выхода`)
  return output
}

function metadataRuleForAssignment(assignment: FullXmlSyncAssignment) {
  return getMetadataProjectSpecByDir(assignment.sourceProjectPath.split("/")[0] ?? "")?.rule
}

function ownerEntryFromAssignment(assignment: FullXmlSyncCompositionEntry): { dir: string; name: string } {
  const parts = assignment.sourceProjectPath.split("/")
  return { dir: parts[0] ?? "", name: parts[1] ?? assignment.itemName }
}

function fileChildNamesForOwner(
  ownerAssignment: FullXmlSyncAssignment,
  assignments: readonly FullXmlSyncCompositionEntry[]
): { forms?: string[]; templates?: string[] } {
  const forms = assignments
    .filter(
      (assignment) =>
        assignment.role === "form" && assignment.ownerLogicalAddress === ownerAssignment.logicalAddress
    )
    .map((assignment) => assignment.itemName)
  return forms.length === 0 ? {} : { forms }
}

function formBodyXmlPath(metadataXmlPath: string, formName: string): string {
  return posix.join(posix.dirname(metadataXmlPath), formName, "Ext", "Form.xml")
}
