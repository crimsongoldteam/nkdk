import { registerMetadataItemCollectionRule, registerMetadataItemRule } from "../../orchestration"
import { MetadataTypeByRule } from "../../orchestration/metadataItem/element"
import { YAMLTypeByRule } from "../../orchestration/metadataItem/yaml"
import { MetadataExternalDataSourceFieldRules } from "./rules"

export type MetadataExternalDataSourceField = MetadataTypeByRule<typeof MetadataExternalDataSourceFieldRules>
export type MetadataExternalDataSourceFieldYAML = YAMLTypeByRule<typeof MetadataExternalDataSourceFieldRules>

export type MetadataExternalDataSourceFields = MetadataExternalDataSourceField[]
export type MetadataExternalDataSourceFieldsYAML = Record<string, MetadataExternalDataSourceFieldYAML>

registerMetadataItemRule({
  propertyType: "MetadataExternalDataSourceField",
  itemRule: MetadataExternalDataSourceFieldRules,
})

registerMetadataItemCollectionRule({
  propertyType: "MetadataExternalDataSourceFields",
  itemRule: MetadataExternalDataSourceFieldRules,
  xmlElement: "Field",
  keyField: "name",
})
