import { collectConfigurationIndexIdentityFromXML } from "../../configurationIndex/collector/collectProperty"
import {
  getConfigurationIndexCollectionContext,
  getConfigurationIndexFormElementLogicalAddress,
  getConfigurationIndexFormSingletonLogicalAddress,
  withConfigurationIndexLogicalAddress,
} from "../../configurationIndex/collector/context"
import type { ConfigurationContextFromXML } from "../../context/types"
import { importPropertiesFromXMLToYAML } from "../property/fromXMLToYAML"
import type { DirectImportTraversal } from "../property/importYamlTypes"
import type { PropertyRuleExecution } from "../property/fn"
import { enterNestedYamlRule } from "../property/yamlRuleCursor"
import { getCanonicalSingletonName, type SingletonNameStyle } from "./singletonName"
import { CollectableElementTypeToYAML, type CollectableElementType, type ElementRule, type ElementXML } from "./types"
import { currentRuleRegistrySet } from "../ruleRegistryExecutionContext"
import { copyYAMLRuntimeMetadata } from "../../../yaml/runtimeMetadata"

export function importFormElementFromXMLToYAML(params: {
  context: ConfigurationContextFromXML
  rule: ElementRule & { itemType: CollectableElementType }
  xml: ElementXML
  name: string
  traversal: DirectImportTraversal
}): Record<string, unknown> {
  const properties = importFormElementPropertiesFromXMLToYAML(params) ?? {}
  const result = {
    Вид: currentRuleRegistrySet<{ formElementKinds: ReadonlyMap<string, string> }>()
      ?.formElementKinds.get(params.rule.itemType) ?? CollectableElementTypeToYAML[params.rule.itemType],
    ...properties,
  }
  copyYAMLRuntimeMetadata(properties, result)
  return result
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
    sources: [{
      context: params.context,
      xml: params.traversal.xmlNodes?.length === 1
        ? params.traversal.xmlNodes[0]!
        : params.xml,
    }],
    itemName: params.name,
    yamlPath: params.traversal.yamlPath,
    rulePath: enterNestedYamlRule(params.traversal, params.rule.itemType).rulePath,
    collector: params.traversal.collector,
    deferred: params.traversal.deferred,
    dependent: params.traversal.dependent,
    audit: params.traversal.audit,
    annotations: params.traversal.annotations,
    profile: params.traversal.profile,
    execution: propertyExecutionFromTraversal(params.traversal),
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
  const yaml = (
    importPropertiesFromXMLToYAML({
      context,
      rule: params.rule,
      sources: [{
        context,
        xml: params.nameStyle?.explicitXMLName === true
          ? withoutImportableXMLName(params.xml)
          : params.xml,
      }],
      itemName: canonicalName,
      yamlPath: params.traversal.yamlPath,
      rulePath: enterNestedYamlRule(params.traversal, params.rule.itemType).rulePath,
      collector: params.traversal.collector,
      deferred: params.traversal.deferred,
      dependent: params.traversal.dependent,
      audit: params.traversal.audit,
      annotations: params.traversal.annotations,
      profile: params.traversal.profile,
      execution: propertyExecutionFromTraversal(params.traversal),
    }) ?? {}
  )
  return yaml
}

function withoutImportableXMLName(xml: ElementXML): ElementXML {
  const { _name, ...properties } = xml
  const result = properties as ElementXML
  Object.defineProperty(result, "_name", { value: _name, enumerable: false })
  return result
}

function propertyExecutionFromTraversal(
  traversal: DirectImportTraversal,
): PropertyRuleExecution | undefined {
  return traversal.execution as PropertyRuleExecution | undefined
}
