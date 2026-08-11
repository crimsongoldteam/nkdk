import { defineMetadataItemCollectionRule } from "../../ruleRuntime/metadataCollection/ruleFactory"
import { MetadataAttributeRules } from "./rules"
import { composeMetadataRules } from "../../ruleRuntime/definition"

const attributePropertyTypes = [
  ["MetadataAttributes", "MetadataAttribute"],
  ["MetadataAttributesWithAllowedTypes", "MetadataAttributesWithAllowedTypes"],
  ["MetadataTabularSectionAttributes", "MetadataTabularSectionAttribute"],
  ["MetadataTabularSectionAttributesWithFill", "MetadataTabularSectionAttributeWithFill"],
  "MetadataCatalogAttributes",
  "MetadataCatalogTabularSectionAttributes",
  "MetadataDocumentAttributes",
  "MetadataDocumentTabularSectionAttributes",
  "MetadataTaskAttributes",
  "MetadataTaskTabularSectionAttributes",
  "MetadataBusinessProcessAttributes",
  "MetadataBusinessProcessTabularSectionAttributes",
  "MetadataExchangePlanAttributes",
  "MetadataExchangePlanTabularSectionAttributes",
  "MetadataChartOfAccountsAttributes",
  "MetadataChartOfAccountsTabularSectionAttributes",
  "MetadataChartOfCalculationTypesAttributes",
  "MetadataChartOfCalculationTypesTabularSectionAttributes",
  "MetadataChartOfCharacteristicTypesAttributes",
  "MetadataChartOfCharacteristicTypesTabularSectionAttributes",
  "MetadataDataProcessorAttributes",
  "MetadataDataProcessorTabularSectionAttributes",
  "MetadataReportAttributes",
  "MetadataReportTabularSectionAttributes",
] as const satisfies readonly (readonly [string, string] | string)[]

export const metadataAttributeCollectionRules = composeMetadataRules(...attributePropertyTypes.map((entry) => {
  const propertyType = typeof entry === "string" ? entry : entry[0]
  const schemaName = typeof entry === "string" ? propertyType.replace(/Attributes$/, "Attribute") : entry[1]
  return defineMetadataItemCollectionRule({
    propertyType,
    schemaName,
    itemRule: MetadataAttributeRules,
    xmlElement: "Attribute",
    keyField: "name",
    collectionItemRule: true,
  })
}))
