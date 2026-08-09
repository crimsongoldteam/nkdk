import { registerMetadataItemCollectionRule, registerMetadataItemRule } from "../../ruleRuntime"
import { MetadataTypeByRule } from "../../ruleRuntime/metadataItem/element"
import { YAMLTypeByRule } from "../../ruleRuntime/metadataItem/yaml"
import { MetadataExternalDataSourceTableCollectionRules, MetadataExternalDataSourceTableRules } from "./rules"

export type MetadataExternalDataSourceTable = MetadataTypeByRule<typeof MetadataExternalDataSourceTableRules>
export type MetadataExternalDataSourceTableYAML = YAMLTypeByRule<typeof MetadataExternalDataSourceTableRules>

export type MetadataExternalDataSourceTables = MetadataExternalDataSourceTable[]
export type MetadataExternalDataSourceTablesYAML = Record<string, MetadataExternalDataSourceTableYAML>

registerMetadataItemRule({
  propertyType: "MetadataExternalDataSourceTable",
  itemRule: MetadataExternalDataSourceTableRules,
})

registerMetadataItemCollectionRule({
  propertyType: "MetadataExternalDataSourceTables",
  itemRule: MetadataExternalDataSourceTableCollectionRules,
  xmlElement: "Table",
  keyField: "name",
  collectionItemRule: true,
})
