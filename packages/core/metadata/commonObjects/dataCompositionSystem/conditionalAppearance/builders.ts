import { definePropertyRule as defineWidePropertyRule, type ExactRuleParams as WideExactRuleParams } from "~/metadata/commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "~/metadata/orchestration/property/types"

export interface ConditionalAppearanceItemsWidePropertyRule extends WidePropertyRuleBase {
  type: "ConditionalAppearanceItems"
}

export type ConditionalAppearanceItemsRuleParams = Omit<ConditionalAppearanceItemsWidePropertyRule, "type">

export function conditionalAppearanceItemsRule<const Params extends ConditionalAppearanceItemsRuleParams>(
  params: WideExactRuleParams<ConditionalAppearanceItemsRuleParams, Params>
): Readonly<{ type: "ConditionalAppearanceItems" } & Params> {
  return defineWidePropertyRule("ConditionalAppearanceItems", params)
}
