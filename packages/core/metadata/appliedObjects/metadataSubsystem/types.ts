import { registerMetadataItemRule } from "../../ruleRuntime"
import { MetadataTypeByRule } from "../../ruleRuntime/metadataItem/element"
import { YAMLTypeByRule } from "../../ruleRuntime/metadataItem/yaml"
import { MetadataSubsystemRules } from "./rules"

export type MetadataSubsystem = MetadataTypeByRule<typeof MetadataSubsystemRules>
export type MetadataSubsystemYAML = YAMLTypeByRule<typeof MetadataSubsystemRules>

registerMetadataItemRule({
  propertyType: "MetadataSubsystem",
  itemRule: MetadataSubsystemRules,
})
