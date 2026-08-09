import { registerMetadataItemCollectionRule, registerMetadataItemRule } from "../../ruleRuntime"
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

registerMetadataItemRule({
  propertyType: "MetadataExternalDataSourceDimensionTable",
  itemRule: MetadataExternalDataSourceDimensionTableRules,
})

registerMetadataItemCollectionRule({
  propertyType: "MetadataExternalDataSourceDimensionTables",
  itemRule: MetadataExternalDataSourceDimensionTableCollectionRules,
  xmlElement: "DimensionTable",
  keyField: "name",
  collectionItemRule: true,
})
