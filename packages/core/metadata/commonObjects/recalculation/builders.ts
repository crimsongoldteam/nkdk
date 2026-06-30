import { definePropertyRule as defineWidePropertyRule, type ExactRuleParams as WideExactRuleParams } from "~/metadata/commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "~/metadata/orchestration/property/types"

export interface RecalculationsWidePropertyRule extends WidePropertyRuleBase {
  type: "Recalculations"
}

export type RecalculationsRuleParams = Omit<RecalculationsWidePropertyRule, "type">

export function recalculationsRule<const Params extends RecalculationsRuleParams>(
  params: WideExactRuleParams<RecalculationsRuleParams, Params>
): Readonly<{ type: "Recalculations" } & Params> {
  return defineWidePropertyRule("Recalculations", params)
}
