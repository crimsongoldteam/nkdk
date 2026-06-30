import { definePropertyRule as defineWidePropertyRule, type ExactRuleParams as WideExactRuleParams } from "~/metadata/commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "~/metadata/orchestration/property/types"

export interface FormCommandsWidePropertyRule extends WidePropertyRuleBase {
  type: "FormCommands"
}

export type FormCommandsRuleParams = Omit<FormCommandsWidePropertyRule, "type">

export function formCommandsRule<const Params extends FormCommandsRuleParams>(
  params: WideExactRuleParams<FormCommandsRuleParams, Params>
): Readonly<{ type: "FormCommands" } & Params> {
  return defineWidePropertyRule("FormCommands", params)
}
