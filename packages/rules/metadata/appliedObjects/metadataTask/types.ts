import { defineMetadataItemRule } from "../../ruleRuntime"
import { MetadataTypeByRule } from "../../ruleRuntime/metadataItem/element"
import { YAMLTypeByRule } from "../../ruleRuntime/metadataItem/yaml"
import { MetadataTaskRules } from "./rules"

export type MetadataTask = MetadataTypeByRule<typeof MetadataTaskRules>
export type MetadataTaskYAML = YAMLTypeByRule<typeof MetadataTaskRules>

export const metadataRuleLayer000 = defineMetadataItemRule({
  propertyType: "MetadataTask",
  itemRule: MetadataTaskRules,
})
