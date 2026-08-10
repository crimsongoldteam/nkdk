import { defineMetadataItemRule } from "../../ruleRuntime"
import { MetadataTypeByRule } from "../../ruleRuntime/metadataItem/element"
import { YAMLTypeByRule } from "../../ruleRuntime/metadataItem/yaml"
import { MetadataCommonFormRules } from "./rules"

export type MetadataCommonForm = MetadataTypeByRule<typeof MetadataCommonFormRules>
export type MetadataCommonFormYAML = YAMLTypeByRule<typeof MetadataCommonFormRules>

export const metadataRuleLayer000 = defineMetadataItemRule({
  propertyType: "MetadataCommonForm",
  itemRule: MetadataCommonFormRules,
})
