import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "../../../commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "../../../orchestration/property/types"
export type ScrollBarUse = "AutoUse" | "DontUse" | "UseAlways"

export type ScrollBarUseEnterprise = {
  Type: "SystemEnumeration"
  Value: `ScrollBarUse.${ScrollBarUse}`
}

export interface ScrollBarUseBooleanWidePropertyRule extends WidePropertyRuleBase {
  type: "ScrollBarUseBoolean"
}

export type ScrollBarUseBooleanRuleParams = Omit<ScrollBarUseBooleanWidePropertyRule, "type">

export function scrollBarUseBooleanRule<const Params extends ScrollBarUseBooleanRuleParams>(
  params: WideExactRuleParams<ScrollBarUseBooleanRuleParams, Params>
): Readonly<{ type: "ScrollBarUseBoolean" } & Params> {
  return defineWidePropertyRule("ScrollBarUseBoolean", params)
}
