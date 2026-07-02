import { ConfigurationContext, ConfigurationContextFromXML } from "../../context/types"
import { importMetadataItemFromYAML } from "../../orchestration"
import { registerMetadataItemCollectionRule } from "../../orchestration/metadataCollection/ruleFactory"
import { exportMetadataCollectionToYAMLAsRecord } from "../../orchestration/metadataCollection/toYAML"
import { importPropertyFromXML } from "../../orchestration/property/fromXML"
import type { PropertyRule } from "../../orchestration/property/types"
import { MetadataWebServiceOperationRules, MetadataWebServiceParameterRules } from "./rules"
import {
  MetadataWebServiceOperationYAML,
  MetadataWebServiceOperations,
  MetadataWebServiceOperationsXML,
  MetadataWebServiceOperationsYAML,
  MetadataWebServiceParameterYAML,
  MetadataWebServiceParameters,
  MetadataWebServiceParametersXML,
  MetadataWebServiceParametersYAML,
} from "./types"

const importMetadataWebServiceParametersFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataWebServiceParametersYAML | undefined
): MetadataWebServiceParameters | undefined => {
  if (!data) return undefined

  const results = Object.entries(data).map(([name, value]) => {
    const properties = importMetadataItemFromYAML({
      context,
      yaml: value as MetadataWebServiceParameterYAML,
      rule: MetadataWebServiceParameterRules,
      name,
    })

    if (properties == undefined) throw new Error("Properties are required")

    return {
      ...properties,
      name,
    }
  })

  return results.length > 0 ? (results as MetadataWebServiceParameters) : undefined
}

registerMetadataItemCollectionRule({
  propertyType: "MetadataWebServiceParameters",
  itemRule: MetadataWebServiceParameterRules,
  xmlElement: "Parameter",
  keyField: "name",
  fromYAML: importMetadataWebServiceParametersFromYAML,
})

const importMetadataWebServiceOperationsFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataWebServiceOperationsYAML | undefined
): MetadataWebServiceOperations | undefined => {
  if (!data) return undefined

  const results = Object.entries(data).map(([name, value]) => {
    const properties = importMetadataItemFromYAML({
      context,
      yaml: value as MetadataWebServiceOperationYAML,
      rule: MetadataWebServiceOperationRules,
      name,
    })

    if (properties == undefined) throw new Error("Properties are required")

    return {
      ...properties,
      name,
    }
  })

  return results.length > 0 ? (results as MetadataWebServiceOperations) : undefined
}

registerMetadataItemCollectionRule({
  propertyType: "MetadataWebServiceOperations",
  itemRule: MetadataWebServiceOperationRules,
  xmlElement: "Operation",
  keyField: "name",
  fromYAML: importMetadataWebServiceOperationsFromYAML,
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
