import { CalculatedFieldUseRestrictionRules } from "./rules"
import { registerMetadataItemRule } from "~/metadata/orchestration"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"

export type CalculatedFieldUseRestriction = MetadataTypeByRule<typeof CalculatedFieldUseRestrictionRules>
export type CalculatedFieldUseRestrictionYAML = YAMLTypeByRule<typeof CalculatedFieldUseRestrictionRules>

registerMetadataItemRule({
  propertyType: "CalculatedFieldUseRestriction",
  itemRule: CalculatedFieldUseRestrictionRules,
})
