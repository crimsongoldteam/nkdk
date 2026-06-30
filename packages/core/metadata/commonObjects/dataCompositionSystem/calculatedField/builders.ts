import { definePropertyRule as defineWidePropertyRule, type ExactRuleParams as WideExactRuleParams } from "~/metadata/commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "~/metadata/orchestration/property/types"

export interface CalculatedFieldUseRestrictionWidePropertyRule extends WidePropertyRuleBase {
  type: "CalculatedFieldUseRestriction"
}

export type CalculatedFieldUseRestrictionRuleParams = Omit<CalculatedFieldUseRestrictionWidePropertyRule, "type">

export function calculatedFieldUseRestrictionRule<const Params extends CalculatedFieldUseRestrictionRuleParams>(
  params: WideExactRuleParams<CalculatedFieldUseRestrictionRuleParams, Params>
): Readonly<{ type: "CalculatedFieldUseRestriction" } & Params> {
  return defineWidePropertyRule("CalculatedFieldUseRestriction", params)
}
export interface CalculatedFieldOrderExpressionWidePropertyRule extends WidePropertyRuleBase {
  type: "CalculatedFieldOrderExpression"
}

export type CalculatedFieldOrderExpressionRuleParams = Omit<CalculatedFieldOrderExpressionWidePropertyRule, "type">

export function calculatedFieldOrderExpressionRule<const Params extends CalculatedFieldOrderExpressionRuleParams>(
  params: WideExactRuleParams<CalculatedFieldOrderExpressionRuleParams, Params>
): Readonly<{ type: "CalculatedFieldOrderExpression" } & Params> {
  return defineWidePropertyRule("CalculatedFieldOrderExpression", params)
}
