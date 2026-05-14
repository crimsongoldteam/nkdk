import { registerMetadataItemRule } from "~/metadata/orchestration"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { MetadataCommandGroupRules } from "./rules"

export type MetadataCommandGroup = MetadataTypeByRule<typeof MetadataCommandGroupRules>
export type MetadataCommandGroupYAML = YAMLTypeByRule<typeof MetadataCommandGroupRules>

registerMetadataItemRule({
  propertyType: "MetadataAppliedCommandGroup",
  itemRule: MetadataCommandGroupRules,
})
