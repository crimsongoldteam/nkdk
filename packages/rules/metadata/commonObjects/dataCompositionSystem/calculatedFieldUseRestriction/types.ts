import { CalculatedFieldUseRestrictionRules } from "./rules"
import { defineMetadataItemRule } from "../../../ruleRuntime"
import { MetadataTypeByRule } from "../../../ruleRuntime/metadataItem/element"
import { YAMLTypeByRule } from "../../../ruleRuntime/metadataItem/yaml"

export type CalculatedFieldUseRestriction = MetadataTypeByRule<typeof CalculatedFieldUseRestrictionRules>
export type CalculatedFieldUseRestrictionYAML = YAMLTypeByRule<typeof CalculatedFieldUseRestrictionRules>

export const metadataRuleLayer000 = defineMetadataItemRule({
  propertyType: "CalculatedFieldUseRestriction",
  itemRule: CalculatedFieldUseRestrictionRules,
})
