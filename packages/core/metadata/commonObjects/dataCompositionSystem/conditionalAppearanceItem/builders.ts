import { definePropertyRule as defineWidePropertyRule, type ExactRuleParams as WideExactRuleParams } from "~/metadata/commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "~/metadata/orchestration/property/types"

export interface FilterWidePropertyRule extends WidePropertyRuleBase {
  type: "Filter"
}

export type FilterRuleParams = Omit<FilterWidePropertyRule, "type">

export function filterRule<const Params extends FilterRuleParams>(
  params: WideExactRuleParams<FilterRuleParams, Params>
): Readonly<{ type: "Filter" } & Params> {
  return defineWidePropertyRule("Filter", params)
}
