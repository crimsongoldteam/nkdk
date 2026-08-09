import { registerMetadataItemRule } from "../../ruleRuntime"
import { MetadataTypeByRule } from "../../ruleRuntime/metadataItem/element"
import { YAMLTypeByRule } from "../../ruleRuntime/metadataItem/yaml"
import { MetadataCommandGroupRules } from "./rules"

export type MetadataCommandGroup = MetadataTypeByRule<typeof MetadataCommandGroupRules>
export type MetadataCommandGroupYAML = YAMLTypeByRule<typeof MetadataCommandGroupRules>

registerMetadataItemRule({
  propertyType: "MetadataAppliedCommandGroup",
  itemRule: MetadataCommandGroupRules,
})
