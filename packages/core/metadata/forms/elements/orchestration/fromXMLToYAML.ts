import { collectConfigurationIndexIdentityFromXML } from "../../../configurationIndex/collector/collectProperty"
import {
  getConfigurationIndexCollectionContext,
  getConfigurationIndexFormElementLogicalAddress,
  getConfigurationIndexFormSingletonLogicalAddress,
  withConfigurationIndexLogicalAddress,
} from "../../../configurationIndex/collector/context"
import type { ConfigurationContextFromXML } from "../../../context/types"
import { importPropertiesFromXMLToYAML } from "../../../orchestration/property/fromXMLToYAML"
import type { DirectImportTraversal } from "../../../orchestration/property/importYamlTypes"
import { enterNestedYamlRule } from "../../../orchestration/property/yamlRuleCursor"
import { getCanonicalSingletonName, type SingletonNameStyle } from "./singletonName"
import { CollectableElementTypeToYAML, type CollectableElementType, type ElementRule, type ElementXML } from "./types"

export function importFormElementFromXMLToYAML(params: {
  context: ConfigurationContextFromXML
  rule: ElementRule & { itemType: CollectableElementType }
  xml: ElementXML
  name: string
  traversal: DirectImportTraversal
}): Record<string, unknown> {
  return {
    Вид: CollectableElementTypeToYAML[params.rule.itemType],
    ...importFormElementPropertiesFromXMLToYAML(params),
  }
}

export function importFormElementPropertiesFromXMLToYAML(params: {
  context: ConfigurationContextFromXML
  rule: ElementRule & { itemType: CollectableElementType }
  xml: ElementXML
  name: string
  traversal: DirectImportTraversal
}): Record<string, unknown> | undefined {
  return importPropertiesFromXMLToYAML({
    context: params.context,
    rule: params.rule,
    sources: [{ context: params.context, xml: params.xml }],
    itemName: params.name,
    yamlPath: params.traversal.yamlPath,
    rulePath: enterNestedYamlRule(params.traversal, params.rule.itemType).rulePath,
    collector: params.traversal.collector,
    deferred: params.traversal.deferred,
    profile: params.traversal.profile,
  })
}

export function importSingleFormElementFromXMLToYAML(params: {
  context: ConfigurationContextFromXML
  rule: ElementRule
  xml: ElementXML | undefined
  ownerXmlName?: string
  nameStyle?: SingletonNameStyle
  traversal: DirectImportTraversal
}): Record<string, unknown> | undefined {
  if (params.xml === undefined) return undefined

  const collection = getConfigurationIndexCollectionContext(params.context)
  const canonicalName = getCanonicalSingletonName({
    ownerLogicalAddress: params.ownerXmlName ?? collection?.logicalAddress ?? "",
    nameStyle: params.nameStyle,
  })
  const logicalAddress =
    collection === undefined
      ? undefined
      : params.nameStyle?.canonicalNameMode === "ownerSuffix"
        ? getConfigurationIndexFormSingletonLogicalAddress(collection, params.nameStyle.canonicalSuffix)
        : canonicalName === undefined
          ? collection.logicalAddress
          : getConfigurationIndexFormElementLogicalAddress(collection, canonicalName)
  const context =
    logicalAddress === undefined ? params.context : withConfigurationIndexLogicalAddress(params.context, logicalAddress)

  collectConfigurationIndexIdentityFromXML({ context, sourceXmlKey: "_id", xmlValue: params.xml._id })
  collectConfigurationIndexIdentityFromXML({
    context,
    sourceXmlKey: "_name",
    xmlValue: params.xml._name,
    reconstructibleXmlName: canonicalName,
  })

  return (
    importPropertiesFromXMLToYAML({
      context,
      rule: params.rule,
      sources: [{ context, xml: params.xml }],
      itemName: canonicalName,
      yamlPath: params.traversal.yamlPath,
      rulePath: enterNestedYamlRule(params.traversal, params.rule.itemType).rulePath,
      collector: params.traversal.collector,
      deferred: params.traversal.deferred,
      profile: params.traversal.profile,
    }) ?? {}
  )
}
