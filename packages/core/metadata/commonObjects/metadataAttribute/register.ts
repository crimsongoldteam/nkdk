import { registerMetadataItemCollectionRule } from "../../orchestration/metadataCollection/ruleFactory"
import { MetadataAttributeRules } from "./rules"

const attributePropertyTypes = [
  "MetadataAttributes",
  "MetadataAttributesWithAllowedTypes",
  "MetadataTabularSectionAttributes",
  "MetadataTabularSectionAttributesWithFill",
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
] as const

for (const propertyType of attributePropertyTypes) {
  registerMetadataItemCollectionRule({
    propertyType,
    itemRule: MetadataAttributeRules,
    xmlElement: "Attribute",
    keyField: "name",
    collectionItemRule: true,
  })
}
