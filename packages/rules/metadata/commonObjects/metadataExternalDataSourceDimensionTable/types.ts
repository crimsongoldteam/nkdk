import { defineMetadataItemCollectionRule, defineMetadataItemRule } from "../../ruleRuntime"
import { MetadataTypeByRule } from "../../ruleRuntime/metadataItem/element"
import { YAMLTypeByRule } from "../../ruleRuntime/metadataItem/yaml"
import {
  MetadataExternalDataSourceDimensionTableCollectionRules,
  MetadataExternalDataSourceDimensionTableRules,
} from "./rules"

export type MetadataExternalDataSourceDimensionTable = MetadataTypeByRule<
  typeof MetadataExternalDataSourceDimensionTableRules
>
export type MetadataExternalDataSourceDimensionTableYAML = YAMLTypeByRule<
  typeof MetadataExternalDataSourceDimensionTableRules
>

export type MetadataExternalDataSourceDimensionTables = MetadataExternalDataSourceDimensionTable[]
export type MetadataExternalDataSourceDimensionTablesYAML = Record<string, MetadataExternalDataSourceDimensionTableYAML>

export const metadataRuleLayer000 = defineMetadataItemRule({
  propertyType: "MetadataExternalDataSourceDimensionTable",
  itemRule: MetadataExternalDataSourceDimensionTableRules,
})

export const metadataRuleLayer001 = defineMetadataItemCollectionRule({
  propertyType: "MetadataExternalDataSourceDimensionTables",
  itemRule: MetadataExternalDataSourceDimensionTableCollectionRules,
  xmlElement: "DimensionTable",
  keyField: "name",
  collectionItemRule: true,
})
