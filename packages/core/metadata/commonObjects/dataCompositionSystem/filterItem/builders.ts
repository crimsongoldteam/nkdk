import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "../../ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "../../../orchestration/property/types"

export interface FilterItemPresentationValueWidePropertyRule extends WidePropertyRuleBase {
  type: "FilterItemPresentationValue"
}

export type FilterItemPresentationValueRuleParams = Omit<FilterItemPresentationValueWidePropertyRule, "type">

export function filterItemPresentationValueRule<const Params extends FilterItemPresentationValueRuleParams>(
  params: WideExactRuleParams<FilterItemPresentationValueRuleParams, Params>
): Readonly<{ type: "FilterItemPresentationValue" } & Params> {
  return defineWidePropertyRule("FilterItemPresentationValue", params)
}
