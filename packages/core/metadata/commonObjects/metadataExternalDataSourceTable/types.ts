import { defineMetadataItemCollectionRule, defineMetadataItemRule } from "../../ruleRuntime"
import { MetadataTypeByRule } from "../../ruleRuntime/metadataItem/element"
import { YAMLTypeByRule } from "../../ruleRuntime/metadataItem/yaml"
import { MetadataExternalDataSourceTableCollectionRules, MetadataExternalDataSourceTableRules } from "./rules"

export type MetadataExternalDataSourceTable = MetadataTypeByRule<typeof MetadataExternalDataSourceTableRules>
export type MetadataExternalDataSourceTableYAML = YAMLTypeByRule<typeof MetadataExternalDataSourceTableRules>

export type MetadataExternalDataSourceTables = MetadataExternalDataSourceTable[]
export type MetadataExternalDataSourceTablesYAML = Record<string, MetadataExternalDataSourceTableYAML>

export const metadataRuleLayer000 = defineMetadataItemRule({
  propertyType: "MetadataExternalDataSourceTable",
  itemRule: MetadataExternalDataSourceTableRules,
})

export const metadataRuleLayer001 = defineMetadataItemCollectionRule({
  propertyType: "MetadataExternalDataSourceTables",
  itemRule: MetadataExternalDataSourceTableCollectionRules,
  xmlElement: "Table",
  keyField: "name",
  collectionItemRule: true,
})
