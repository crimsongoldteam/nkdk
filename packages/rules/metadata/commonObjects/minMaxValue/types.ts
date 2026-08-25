import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "../ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "@nkdk/runtime/rule-kit"

export type MinMaxValueXsiType = "xs:string" | "xs:decimal"

export type MinMaxValueModel =
  | number
  | { readonly kind: "xml"; readonly xsiType?: string; readonly text: string }

export interface MinMaxValueWidePropertyRule extends WidePropertyRuleBase {
  type: "MinMaxValue"
}

export type MinMaxValueRuleParams = Omit<MinMaxValueWidePropertyRule, "type">

export function minMaxValueRule<const Params extends MinMaxValueRuleParams>(
  params: WideExactRuleParams<MinMaxValueRuleParams, Params>
): Readonly<{ type: "MinMaxValue" } & Params> {
  return defineWidePropertyRule("MinMaxValue", params)
}
