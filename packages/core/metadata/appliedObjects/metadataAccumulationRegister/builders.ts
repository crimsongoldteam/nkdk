import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "../../commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "@nkdk/runtime/rule-kit"

export interface AccumulationRegisterAggregatesWidePropertyRule extends WidePropertyRuleBase {
  type: "AccumulationRegisterAggregates"
}

export type AccumulationRegisterAggregatesRuleParams = Omit<AccumulationRegisterAggregatesWidePropertyRule, "type">

export function accumulationRegisterAggregatesRule<const Params extends AccumulationRegisterAggregatesRuleParams>(
  params: WideExactRuleParams<AccumulationRegisterAggregatesRuleParams, Params>
): Readonly<{ type: "AccumulationRegisterAggregates" } & Params> {
  return defineWidePropertyRule("AccumulationRegisterAggregates", params)
}
