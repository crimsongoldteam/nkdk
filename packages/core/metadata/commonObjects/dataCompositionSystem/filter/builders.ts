import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "../../ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "../../../orchestration/property/types"

export interface FilterItemWidePropertyRule extends WidePropertyRuleBase {
  type: "FilterItem"
}

export type FilterItemRuleParams = Omit<FilterItemWidePropertyRule, "type">

export function filterItemRule<const Params extends FilterItemRuleParams>(
  params: WideExactRuleParams<FilterItemRuleParams, Params>
): Readonly<{ type: "FilterItem" } & Params> {
  return defineWidePropertyRule("FilterItem", { configurationIndexAddressing: "yamlPath" as const, ...params })
}
