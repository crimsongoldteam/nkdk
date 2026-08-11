import { defineMetadataItemRule } from "../../ruleRuntime"
import { MetadataTypeByRule } from "../../ruleRuntime/metadataItem/element"
import { YAMLTypeByRule } from "../../ruleRuntime/metadataItem/yaml"
import { MetadataStyleRules } from "./rules"

export type MetadataStyle = MetadataTypeByRule<typeof MetadataStyleRules>
export type MetadataStyleYAML = YAMLTypeByRule<typeof MetadataStyleRules>

export const metadataRuleLayer000 = defineMetadataItemRule({
  propertyType: "MetadataStyle",
  itemRule: MetadataStyleRules,
})
