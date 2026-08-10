import { defineMetadataItemRule } from "../../ruleRuntime"
import { MetadataTypeByRule } from "../../ruleRuntime/metadataItem/element"
import { YAMLTypeByRule } from "../../ruleRuntime/metadataItem/yaml"
import { MetadataSubsystemRules } from "./rules"

export type MetadataSubsystem = MetadataTypeByRule<typeof MetadataSubsystemRules>
export type MetadataSubsystemYAML = YAMLTypeByRule<typeof MetadataSubsystemRules>

export const metadataRuleLayer000 = defineMetadataItemRule({
  propertyType: "MetadataSubsystem",
  itemRule: MetadataSubsystemRules,
})
