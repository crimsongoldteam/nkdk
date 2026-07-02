import { registerMetadataItemRule } from "../../orchestration"
import { MetadataTypeByRule } from "../../orchestration/metadataItem/element"
import { YAMLTypeByRule } from "../../orchestration/metadataItem/yaml"
import { MetadataCommandGroupRules } from "./rules"

export type MetadataCommandGroup = MetadataTypeByRule<typeof MetadataCommandGroupRules>
export type MetadataCommandGroupYAML = YAMLTypeByRule<typeof MetadataCommandGroupRules>

registerMetadataItemRule({
  propertyType: "MetadataAppliedCommandGroup",
  itemRule: MetadataCommandGroupRules,
})
