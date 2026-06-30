import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "~/metadata/commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "~/metadata/orchestration/property/types"
import { registerMetadataItemRule } from "~/metadata/orchestration"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { ConditionalAppearanceRules } from "./rules"

export type ConditionalAppearance = MetadataTypeByRule<typeof ConditionalAppearanceRules>
export type ConditionalAppearanceYAML = YAMLTypeByRule<typeof ConditionalAppearanceRules>

registerMetadataItemRule({
  propertyType: "ConditionalAppearance",
  itemRule: ConditionalAppearanceRules,
})

export interface ConditionalAppearanceItemsWidePropertyRule extends WidePropertyRuleBase {
  type: "ConditionalAppearanceItems"
}

export type ConditionalAppearanceItemsRuleParams = Omit<ConditionalAppearanceItemsWidePropertyRule, "type">

export function conditionalAppearanceItemsRule<const Params extends ConditionalAppearanceItemsRuleParams>(
  params: WideExactRuleParams<ConditionalAppearanceItemsRuleParams, Params>
): Readonly<{ type: "ConditionalAppearanceItems" } & Params> {
  return defineWidePropertyRule("ConditionalAppearanceItems", params)
}
