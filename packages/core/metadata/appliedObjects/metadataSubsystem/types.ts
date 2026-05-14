import { registerMetadataItemRule } from "~/metadata/orchestration"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { MetadataSubsystemRules } from "./rules"

export type MetadataSubsystem = MetadataTypeByRule<typeof MetadataSubsystemRules>
export type MetadataSubsystemYAML = YAMLTypeByRule<typeof MetadataSubsystemRules>

registerMetadataItemRule({
  propertyType: "MetadataSubsystem",
  itemRule: MetadataSubsystemRules,
})
