import { registerMetadataItemCollectionRule, registerMetadataItemRule } from "../../orchestration"
import { MetadataTypeByRule } from "../../orchestration/metadataItem/element"
import { YAMLTypeByRule } from "../../orchestration/metadataItem/yaml"
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
