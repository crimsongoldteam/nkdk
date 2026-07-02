import { registerMetadataItemRule } from "../../orchestration"
import { MetadataTypeByRule } from "../../orchestration/metadataItem/element"
import { YAMLTypeByRule } from "../../orchestration/metadataItem/yaml"
import { MetadataSubsystemRules } from "./rules"

export type MetadataSubsystem = MetadataTypeByRule<typeof MetadataSubsystemRules>
export type MetadataSubsystemYAML = YAMLTypeByRule<typeof MetadataSubsystemRules>

registerMetadataItemRule({
  propertyType: "MetadataSubsystem",
  itemRule: MetadataSubsystemRules,
})
