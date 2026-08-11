import { defineMetadataItemCollectionRule } from "../../ruleRuntime/metadataCollection/ruleFactory"
import { MetadataTabularSectionRules } from "./rules"
import { composeMetadataRules } from "../../ruleRuntime/definition"

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

export const metadataTabularSectionCollectionRules = composeMetadataRules(...tabularSectionPropertyTypes.map((propertyType) =>
  defineMetadataItemCollectionRule({
    propertyType,
    schemaName: propertyType.replace(/TabularSections$/, "TabularSection"),
    itemRule: MetadataTabularSectionRules,
    xmlElement: "TabularSection",
    keyField: "name",
    collectionItemRule: true,
  })
))
