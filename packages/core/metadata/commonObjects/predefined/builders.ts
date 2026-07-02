import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "../ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "../../orchestration/property/types"

export interface PredefinedWidePropertyRule extends WidePropertyRuleBase {
  type: "Predefined"
}

export type PredefinedRuleParams = Omit<PredefinedWidePropertyRule, "type">

export function predefinedRule<const Params extends PredefinedRuleParams>(
  params: WideExactRuleParams<PredefinedRuleParams, Params>
): Readonly<{ type: "Predefined" } & Params> {
  return defineWidePropertyRule("Predefined", params)
}
