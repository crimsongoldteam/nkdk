import { CalculatedFieldUseRestrictionRules } from "./rules"
import { registerMetadataItemRule } from "../../../orchestration"
import { MetadataTypeByRule } from "../../../orchestration/metadataItem/element"
import { YAMLTypeByRule } from "../../../orchestration/metadataItem/yaml"

export type CalculatedFieldUseRestriction = MetadataTypeByRule<typeof CalculatedFieldUseRestrictionRules>
export type CalculatedFieldUseRestrictionYAML = YAMLTypeByRule<typeof CalculatedFieldUseRestrictionRules>

registerMetadataItemRule({
  propertyType: "CalculatedFieldUseRestriction",
  itemRule: CalculatedFieldUseRestrictionRules,
})
