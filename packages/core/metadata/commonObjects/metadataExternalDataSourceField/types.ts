import { registerMetadataItemCollectionRule, registerMetadataItemRule } from "../../ruleRuntime"
import { MetadataTypeByRule } from "../../ruleRuntime/metadataItem/element"
import { YAMLTypeByRule } from "../../ruleRuntime/metadataItem/yaml"
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
