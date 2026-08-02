import { registerMetadataItemCollectionRule } from "../../orchestration/metadataCollection/ruleFactory"
import { MetadataTabularSectionRules } from "./rules"

const tabularSectionPropertyTypes = [
  "MetadataTabularSections",
  "MetadataCatalogTabularSections",
  "MetadataDocumentTabularSections",
  "MetadataTaskTabularSections",
  "MetadataBusinessProcessTabularSections",
  "MetadataExchangePlanTabularSections",
  "MetadataChartOfAccountsTabularSections",
  "MetadataChartOfCalculationTypesTabularSections",
  "MetadataChartOfCharacteristicTypesTabularSections",
  "MetadataDataProcessorTabularSections",
  "MetadataReportTabularSections",
] as const

for (const propertyType of tabularSectionPropertyTypes) {
  registerMetadataItemCollectionRule({
    propertyType,
    itemRule: MetadataTabularSectionRules,
    xmlElement: "TabularSection",
    keyField: "name",
    collectionItemRule: true,
  })
}
