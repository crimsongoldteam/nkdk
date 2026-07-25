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
import type { CompiledMetadataResourceTopology } from "../resourceTopology/types"
import { compileRegisteredMetadataResourceTopology } from "../resourceTopology/registry"
import { getMetadataXmlPrepareCapability } from "../resourceTopology/capabilities"

export function prepareFullXmlSyncAssignment(params: {
  assignment: FullXmlSyncAssignment
  preparedYamlFile: PreparedYamlFile
  context: ConfigurationContextWithExportToXML
  index: ConfigurationIndexReader
  assignments?: readonly FullXmlSyncCompositionEntry[]
  topology?: CompiledMetadataResourceTopology
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
  const documents =
    params.assignment.nodeId === undefined || params.assignment.potentialOutputs === undefined
      ? prepareAssignmentDocuments({ ...params, context, profile })
      : prepareTopologyAssignmentDocuments({
          ...params,
          context,
          profile,
          topology: params.topology ?? compileRegisteredMetadataResourceTopology(),
        })
  return { assignment: params.assignment, documents, indexCollector, profile }
}

function prepareTopologyAssignmentDocuments(
  params: Parameters<typeof prepareFullXmlSyncAssignment>[0] & {
    context: ConfigurationContextWithExportToXML
    profile: ReturnType<typeof createYAMLToXMLProfile>
    topology: CompiledMetadataResourceTopology
  }
): readonly PreparedXMLDocument[] {
  const assignmentNode = params.topology.assignments.find((candidate) => candidate.id === params.assignment.nodeId)
  if (assignmentNode === undefined) throw new Error(`Не найден узел топологии: ${params.assignment.nodeId}`)
  const outputs = params.assignment.potentialOutputs ?? []
  const outputsByCapability = Map.groupBy(outputs, (output) => output.prepareCapabilityId)
  const documents = [...outputsByCapability].flatMap(([capabilityId, capabilityOutputs]) => {
    const capability = getMetadataXmlPrepareCapability(capabilityId)
    if (capability === undefined) throw new Error(`Не зарегистрирована возможность подготовки XML: ${capabilityId}`)
    return capability.run({
      context: params.context,
      preparedYamlFile: params.preparedYamlFile,
      assignment: assignmentNode,
      itemName: params.assignment.itemName,
      logicalAddress: params.assignment.logicalAddress,
      outputs: capabilityOutputs,
      index: params.index,
      composition: (params.assignments ?? []).map((entry) => ({
        sourceProjectPath: entry.sourceProjectPath,
        itemName: entry.itemName,
        logicalAddress: entry.logicalAddress,
        assignmentRole: entry.role === "form" ? "fileItem" : entry.role,
        ...(entry.ownerLogicalAddress === undefined ? {} : { ownerLogicalAddress: entry.ownerLogicalAddress }),
      })),
      profile: params.profile,
    })
  })
  const allowed = new Set(outputs.map((output) => output.declarationId))
  const seen = new Set<string>()
  for (const document of documents) {
    if (!allowed.has(document.declarationId)) {
      throw new Error(`Возможность вернула необъявленный XML-документ: ${document.declarationId}`)
    }
    if (seen.has(document.declarationId)) {
      throw new Error(`XML-документ подготовлен повторно: ${document.declarationId}`)
    }
    seen.add(document.declarationId)
  }
  return documents
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
