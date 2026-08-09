import { CalculatedFieldUseRestrictionRules } from "./rules"
import { registerMetadataItemRule } from "../../../ruleRuntime"
import { MetadataTypeByRule } from "../../../ruleRuntime/metadataItem/element"
import { YAMLTypeByRule } from "../../../ruleRuntime/metadataItem/yaml"

export type CalculatedFieldUseRestriction = MetadataTypeByRule<typeof CalculatedFieldUseRestrictionRules>
export type CalculatedFieldUseRestrictionYAML = YAMLTypeByRule<typeof CalculatedFieldUseRestrictionRules>

registerMetadataItemRule({
  propertyType: "CalculatedFieldUseRestriction",
  itemRule: CalculatedFieldUseRestrictionRules,
})
