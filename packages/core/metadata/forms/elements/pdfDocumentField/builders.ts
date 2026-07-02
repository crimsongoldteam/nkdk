import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "../../../commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "../../../orchestration/property/types"

export interface SingleViewStatusAdditionWidePropertyRule extends WidePropertyRuleBase {
  type: "SingleViewStatusAddition"
}

export type SingleViewStatusAdditionRuleParams = Omit<SingleViewStatusAdditionWidePropertyRule, "type">

export function singleViewStatusAdditionRule<const Params extends SingleViewStatusAdditionRuleParams>(
  params: WideExactRuleParams<SingleViewStatusAdditionRuleParams, Params>
): Readonly<{ type: "SingleViewStatusAddition" } & Params> {
  return defineWidePropertyRule("SingleViewStatusAddition", params)
}
