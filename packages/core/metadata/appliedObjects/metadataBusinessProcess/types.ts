import { defineMetadataItemRule } from "../../ruleRuntime"
import { MetadataTypeByRule } from "../../ruleRuntime/metadataItem/element"
import { YAMLTypeByRule } from "../../ruleRuntime/metadataItem/yaml"
import { MetadataBusinessProcessRules } from "./rules"

export type MetadataBusinessProcess = MetadataTypeByRule<typeof MetadataBusinessProcessRules>
export type MetadataBusinessProcessYAML = YAMLTypeByRule<typeof MetadataBusinessProcessRules>

export const metadataRuleLayer000 = defineMetadataItemRule({
  propertyType: "MetadataBusinessProcess",
  itemRule: MetadataBusinessProcessRules,
})
