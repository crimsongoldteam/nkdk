import { defineMetadataItemRule } from "../../ruleRuntime"
import { MetadataTypeByRule } from "../../ruleRuntime/metadataItem/element"
import { YAMLTypeByRule } from "../../ruleRuntime/metadataItem/yaml"
import { MetadataExternalDataSourceRules } from "./rules"

export type MetadataExternalDataSource = MetadataTypeByRule<typeof MetadataExternalDataSourceRules>
export type MetadataExternalDataSourceYAML = YAMLTypeByRule<typeof MetadataExternalDataSourceRules>

export const metadataRuleLayer000 = defineMetadataItemRule({
  propertyType: "MetadataExternalDataSource",
  itemRule: MetadataExternalDataSourceRules,
})
