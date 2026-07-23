import { registerMetadataItemCollectionRule } from "../../orchestration/metadataCollection/ruleFactory"
import {
  MetadataChartOfAccountsTabularSectionRules,
  MetadataBusinessProcessTabularSectionRules,
  MetadataChartOfCalculationTypesTabularSectionRules,
  MetadataChartOfCharacteristicTypesTabularSectionRules,
  MetadataDataProcessorTabularSectionRules,
  MetadataDocumentTabularSectionRules,
  MetadataExchangePlanTabularSectionRules,
  MetadataReportTabularSectionRules,
  MetadataTaskTabularSectionRules,
  MetadataTabularSectionRules,
} from "./rules"

registerMetadataItemCollectionRule({
  propertyType: "MetadataTabularSections",
  itemRule: MetadataTabularSectionRules,
  xmlElement: "TabularSection",
  keyField: "name",
  collectionItemRule: true,
})

registerMetadataItemCollectionRule({
  propertyType: "MetadataDocumentTabularSections",
  itemRule: MetadataDocumentTabularSectionRules,
  xmlElement: "TabularSection",
  keyField: "name",
  collectionItemRule: true,
})

registerMetadataItemCollectionRule({
  propertyType: "MetadataTaskTabularSections",
  itemRule: MetadataTaskTabularSectionRules,
  xmlElement: "TabularSection",
  keyField: "name",
  collectionItemRule: true,
})

registerMetadataItemCollectionRule({
  propertyType: "MetadataBusinessProcessTabularSections",
  itemRule: MetadataBusinessProcessTabularSectionRules,
  xmlElement: "TabularSection",
  keyField: "name",
  collectionItemRule: true,
})

registerMetadataItemCollectionRule({
  propertyType: "MetadataDataProcessorTabularSections",
  itemRule: MetadataDataProcessorTabularSectionRules,
  xmlElement: "TabularSection",
  keyField: "name",
  collectionItemRule: true,
})

registerMetadataItemCollectionRule({
  propertyType: "MetadataReportTabularSections",
  itemRule: MetadataReportTabularSectionRules,
  xmlElement: "TabularSection",
  keyField: "name",
  collectionItemRule: true,
})

registerMetadataItemCollectionRule({
  propertyType: "MetadataExchangePlanTabularSections",
  itemRule: MetadataExchangePlanTabularSectionRules,
  xmlElement: "TabularSection",
  keyField: "name",
  collectionItemRule: true,
})

registerMetadataItemCollectionRule({
  propertyType: "MetadataChartOfAccountsTabularSections",
  itemRule: MetadataChartOfAccountsTabularSectionRules,
  xmlElement: "TabularSection",
  keyField: "name",
  collectionItemRule: true,
})

registerMetadataItemCollectionRule({
  propertyType: "MetadataChartOfCalculationTypesTabularSections",
  itemRule: MetadataChartOfCalculationTypesTabularSectionRules,
  xmlElement: "TabularSection",
  keyField: "name",
  collectionItemRule: true,
})

registerMetadataItemCollectionRule({
  propertyType: "MetadataChartOfCharacteristicTypesTabularSections",
  itemRule: MetadataChartOfCharacteristicTypesTabularSectionRules,
  xmlElement: "TabularSection",
  keyField: "name",
  collectionItemRule: true,
})
