import { ConfigurationContext, ConfigurationContextFromXML } from "../../context/types"
import { registerMetadataItemCollectionRule } from "../../orchestration/metadataCollection/ruleFactory"
import { exportMetadataCollectionToYAMLAsRecord } from "../../orchestration/metadataCollection/toYAML"
import { importPropertyFromXML } from "../../orchestration/property/fromXML"
import type { PropertyRule } from "../../orchestration/property/types"
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
import {
  MetadataTabularSection,
  MetadataTabularSectionYAML,
  MetadataTabularSections,
  MetadataTabularSectionsXML,
  MetadataTabularSectionsYAML,
} from "./types"

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

// Compat exports for consumers that call these functions directly
export const importMetadataTabularSectionsFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  xml: MetadataTabularSectionsXML | undefined
): MetadataTabularSections | undefined => {
  return importPropertyFromXML({ context, rule: { type: "MetadataTabularSections" }, value: xml }) as
    | MetadataTabularSections
    | undefined
}

export const exportMetadataTabularSectionsToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataTabularSections | undefined
): MetadataTabularSectionsYAML | undefined => {
  return exportMetadataCollectionToYAMLAsRecord({
    context,
    data,
    itemRule: MetadataTabularSectionRules,
    keyField: "name",
  }) as MetadataTabularSectionsYAML | undefined
}

export const exportMetadataTabularSectionToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataTabularSection | undefined
): MetadataTabularSectionYAML | undefined => {
  if (!data) return undefined
  const result = exportMetadataTabularSectionsToYAML(context, _rule, [data])
  if (!result) return undefined
  return result[data.name] as MetadataTabularSectionYAML | undefined
}
