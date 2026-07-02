import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "../ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "../../orchestration/property/types"

export interface HelpWidePropertyRule extends WidePropertyRuleBase {
  type: "Help"
}

export type HelpRuleParams = Omit<HelpWidePropertyRule, "type">

export function helpRule<const Params extends HelpRuleParams>(
  params: WideExactRuleParams<HelpRuleParams, Params>
): Readonly<{ type: "Help" } & Params> {
  return defineWidePropertyRule("Help", params)
}
