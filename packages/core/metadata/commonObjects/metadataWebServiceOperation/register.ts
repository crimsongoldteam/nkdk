import { ConfigurationContext, ConfigurationContextFromXML } from "../../context/types"
import { registerMetadataItemCollectionRule } from "../../orchestration/metadataCollection/ruleFactory"
import { exportMetadataCollectionToYAMLAsRecord } from "../../orchestration/metadataCollection/toYAML"
import { importPropertyFromXML } from "../../orchestration/property/fromXML"
import type { PropertyRule } from "../../orchestration/property/types"
import { MetadataWebServiceOperationRules, MetadataWebServiceParameterRules } from "./rules"
import {
  MetadataWebServiceOperations,
  MetadataWebServiceOperationsXML,
  MetadataWebServiceOperationsYAML,
  MetadataWebServiceParameters,
  MetadataWebServiceParametersXML,
  MetadataWebServiceParametersYAML,
} from "./types"

registerMetadataItemCollectionRule({
  propertyType: "MetadataWebServiceParameters",
  itemRule: MetadataWebServiceParameterRules,
  xmlElement: "Parameter",
  keyField: "name",
  configurationIndexUidSegment: "Параметр",
})

registerMetadataItemCollectionRule({
  propertyType: "MetadataWebServiceOperations",
  itemRule: MetadataWebServiceOperationRules,
  xmlElement: "Operation",
  keyField: "name",
  configurationIndexUidSegment: "Операция",
})

export const importMetadataWebServiceParametersFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  xml: MetadataWebServiceParametersXML | undefined
): MetadataWebServiceParameters | undefined => {
  return importPropertyFromXML({
    context,
    rule: { type: "MetadataWebServiceParameters" },
    value: xml,
  }) as MetadataWebServiceParameters | undefined
}

export const importMetadataWebServiceOperationsFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  xml: MetadataWebServiceOperationsXML | undefined
): MetadataWebServiceOperations | undefined => {
  return importPropertyFromXML({
    context,
    rule: { type: "MetadataWebServiceOperations" },
    value: xml,
  }) as MetadataWebServiceOperations | undefined
}

export const exportMetadataWebServiceParametersToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataWebServiceParameters | undefined
): MetadataWebServiceParametersYAML | undefined => {
  return exportMetadataCollectionToYAMLAsRecord({
    context,
    data,
    itemRule: MetadataWebServiceParameterRules,
    keyField: "name",
  }) as MetadataWebServiceParametersYAML | undefined
}

export const exportMetadataWebServiceOperationsToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataWebServiceOperations | undefined
): MetadataWebServiceOperationsYAML | undefined => {
  return exportMetadataCollectionToYAMLAsRecord({
    context,
    data,
    itemRule: MetadataWebServiceOperationRules,
    keyField: "name",
  }) as MetadataWebServiceOperationsYAML | undefined
}
