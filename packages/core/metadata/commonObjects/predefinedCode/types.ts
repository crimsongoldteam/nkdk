import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "../ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "../../orchestration/property/types"
import { Type } from "@sinclairtypebox"
import type { Static } from "@sinclairtypebox"
import { BasePropertyRule } from "../../orchestration"

export const PredefinedCodeJSONSchema = Type.Union([Type.String(), Type.Number()])

export type PredefinedCode = string | number
export type PredefinedCodeYAML = Static<typeof PredefinedCodeJSONSchema>

export interface PredefinedCodePropertyRule extends BasePropertyRule {
  type: "PredefinedCode"
}

export interface PredefinedCodeWidePropertyRule extends WidePropertyRuleBase {
  type: "PredefinedCode"
}

export type PredefinedCodeRuleParams = Omit<PredefinedCodeWidePropertyRule, "type">

export function predefinedCodeRule<const Params extends PredefinedCodeRuleParams>(
  params: WideExactRuleParams<PredefinedCodeRuleParams, Params>
): Readonly<{ type: "PredefinedCode" } & Params> {
  return defineWidePropertyRule("PredefinedCode", params)
}
