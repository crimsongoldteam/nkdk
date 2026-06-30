import { definePropertyRule as defineWidePropertyRule, type ExactRuleParams as WideExactRuleParams } from "~/metadata/commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "~/metadata/orchestration/property/types"

export interface ExchangePlanContentItemsWidePropertyRule extends WidePropertyRuleBase {
  type: "ExchangePlanContentItems"
}

export type ExchangePlanContentItemsRuleParams = Omit<ExchangePlanContentItemsWidePropertyRule, "type">

export function exchangePlanContentItemsRule<const Params extends ExchangePlanContentItemsRuleParams>(
  params: WideExactRuleParams<ExchangePlanContentItemsRuleParams, Params>
): Readonly<{ type: "ExchangePlanContentItems" } & Params> {
  return defineWidePropertyRule("ExchangePlanContentItems", params)
}
