import { createConfigurationIndexCollector } from "../configurationIndex/collector/writer"
import { createConfigurationIndexExportRuntime } from "../configurationIndex/exportRuntime"
import type { ConfigurationIndexReader } from "../configurationIndex/sharedSnapshot"
import type { ConfigurationContextWithExportToXML } from "../context/types"
import { createYAMLToXMLProfile } from "../ruleRuntime/property/fromYAMLToXMLTypes"
import type { PreparedYamlFile } from "../project/preparedYamlProject"
import type { FullXmlSyncAssignment, PreparedXMLAssignment, PreparedXMLDocument } from "./types"
import type { CompiledMetadataResourceTopology } from "../resourceTopology/core/types"
import { compileRegisteredMetadataResourceTopology } from "../resourceTopology/adapters/registeredRules"
import { getMetadataXmlPrepareCapability } from "../resourceTopology/adapters/capabilities"
import type { MetadataXmlPrepareComposition } from "../resourceTopology/adapters/capabilities"
import { classifyMetadataProjectPath } from "../resourceTopology/core/projectProjection"
import { projectXmlExportOwnerChain } from "../resourceTopology/core/xmlExportProjection"
import {
  withImportMetadataTargetOwners,
  withExportToXMLItemsTree,
} from "../ruleRuntime/appliedObject/metadataItemOwnerContext"
import { metadataTargetOwnerFromRule } from "../ruleRuntime/property/metadataTargetString"
import { getMetadataComponentDescriptor } from "../components/descriptor"

export function prepareFullXmlSyncAssignment(params: {
  assignment: FullXmlSyncAssignment
  preparedYamlFile: PreparedYamlFile
  basePreparedYamlFile?: PreparedYamlFile
  baseConfigurationIndex?: ConfigurationIndexReader
  context: ConfigurationContextWithExportToXML
  index: ConfigurationIndexReader
  composition: MetadataXmlPrepareComposition
  topology?: CompiledMetadataResourceTopology
}): PreparedXMLAssignment {
  const indexCollector = createConfigurationIndexCollector()
  const runtime = createConfigurationIndexExportRuntime({
    source: params.index,
    collector: indexCollector,
    targetProjectPath: params.assignment.sourceProjectPath,
    logicalAddress: params.assignment.logicalAddress,
    ...(params.context.importFromYAML?.referenceRemap === undefined
      ? {}
      : {
          referencePathByCurrentPath:
            params.context.importFromYAML.referenceRemap.referencePathByCurrentPath,
        }),
  })
  const context: ConfigurationContextWithExportToXML = {
    ...params.context,
    exportToXML: { ...params.context.exportToXML, configurationIndex: runtime },
  }
  const profile = createYAMLToXMLProfile()
  const documents = prepareTopologyAssignmentDocuments({
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
  const effectiveAssignmentNode =
    params.assignment.role === "configuration" && params.context.exportToXML.componentKind !== undefined
      ? {
          ...assignmentNode,
          itemRule: getMetadataComponentDescriptor(
            params.context.exportToXML.componentKind
          ).rootRule,
        }
      : assignmentNode
  const outputs = params.assignment.potentialOutputs
  const context = withTopologyMetadataTargetOwners(params)
  const outputsByCapability = Map.groupBy(outputs, (output) => output.prepareCapabilityId)
  const documents = [...outputsByCapability].flatMap(([capabilityId, capabilityOutputs]) => {
    const capability = getMetadataXmlPrepareCapability(capabilityId)
    if (capability === undefined) throw new Error(`Не зарегистрирована возможность подготовки XML: ${capabilityId}`)
    return capability.run({
      context,
      preparedYamlFile: params.preparedYamlFile,
      ...(params.basePreparedYamlFile === undefined
        ? {}
        : { basePreparedYamlFile: params.basePreparedYamlFile }),
      ...(params.baseConfigurationIndex === undefined
        ? {}
        : {
            baseConfigurationIndex:
              params.baseConfigurationIndex,
          }),
      assignment: effectiveAssignmentNode,
      itemName: params.assignment.itemName,
      logicalAddress: params.assignment.logicalAddress,
      outputs: capabilityOutputs,
      index: params.index,
      composition: params.composition,
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

function withTopologyMetadataTargetOwners(
  params: Parameters<typeof prepareFullXmlSyncAssignment>[0] & {
    context: ConfigurationContextWithExportToXML
    topology: CompiledMetadataResourceTopology
  }
): ConfigurationContextWithExportToXML {
  const match = classifyMetadataProjectPath(params.topology, params.assignment.sourceProjectPath)
  if (match?.kind !== "content") return params.context

  let context = params.context
  for (const owner of projectXmlExportOwnerChain(params.topology, match)) {
    const resolvedOwner = metadataTargetOwnerFromRule({
      itemRule: owner.assignment.itemRule,
      name: owner.itemName,
      context,
    })
    const ownerContext = [
      {
        itemType: owner.assignment.itemRule.itemType,
        name: owner.itemName,
        path: owner.logicalAddress,
        ...(resolvedOwner === undefined ? {} : { owner: resolvedOwner }),
      },
    ]
    context = withExportToXMLItemsTree(
      withImportMetadataTargetOwners(context, ownerContext),
      ownerContext
    )
  }
  return context
}
