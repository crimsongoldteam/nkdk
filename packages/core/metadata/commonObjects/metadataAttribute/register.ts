import { registerMetadataItemCollectionRule } from "../../ruleRuntime/metadataCollection/ruleFactory"
import { MetadataAttributeRules } from "./rules"

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

for (const entry of attributePropertyTypes) {
  const propertyType = typeof entry === "string" ? entry : entry[0]
  const schemaName = typeof entry === "string" ? propertyType.replace(/Attributes$/, "Attribute") : entry[1]
  registerMetadataItemCollectionRule({
    propertyType,
    schemaName,
    itemRule: MetadataAttributeRules,
    xmlElement: "Attribute",
    keyField: "name",
    collectionItemRule: true,
  })
}
