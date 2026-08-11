import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "../../../commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "@nkdk/runtime/rule-kit"

export interface FormCommandsWidePropertyRule extends WidePropertyRuleBase {
  type: "FormCommands"
}

export type FormCommandsRuleParams = Omit<FormCommandsWidePropertyRule, "type">

export function formCommandsRule<const Params extends FormCommandsRuleParams>(
  params: WideExactRuleParams<FormCommandsRuleParams, Params>
): Readonly<{ type: "FormCommands" } & Params> {
  return defineWidePropertyRule("FormCommands", params)
}
