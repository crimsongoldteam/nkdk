import { defineMetadataItemRule } from "../../ruleRuntime"
import { MetadataTypeByRule } from "../../ruleRuntime/metadataItem/element"
import { YAMLTypeByRule } from "../../ruleRuntime/metadataItem/yaml"
import { MetadataCommandGroupRules } from "./rules"

export type MetadataCommandGroup = MetadataTypeByRule<typeof MetadataCommandGroupRules>
export type MetadataCommandGroupYAML = YAMLTypeByRule<typeof MetadataCommandGroupRules>

export const metadataRuleLayer000 = defineMetadataItemRule({
  propertyType: "MetadataAppliedCommandGroup",
  itemRule: MetadataCommandGroupRules,
})
