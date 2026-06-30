import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "~/metadata/commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "~/metadata/orchestration/property/types"
import { Static, Type } from "@sinclair/typebox"
import { BasePropertyRule } from "~/metadata/orchestration"

export const StringOrNumberJSONSchema = Type.Union([Type.String(), Type.Number()])

export type StringOrNumber = string | number
export type StringOrNumberYAML = Static<typeof StringOrNumberJSONSchema>

export interface StringOrNumberPropertyRule extends BasePropertyRule {
  type: "StringOrNumber"
}

export type StringOrNumberReference = {
  value: StringOrNumber
  xsiType?: string
}

export interface StringOrNumberWidePropertyRule extends WidePropertyRuleBase {
  type: "StringOrNumber"
}

export type StringOrNumberRuleParams = Omit<StringOrNumberWidePropertyRule, "type">

export function stringOrNumberRule<const Params extends StringOrNumberRuleParams>(
  params: WideExactRuleParams<StringOrNumberRuleParams, Params>
): Readonly<{ type: "StringOrNumber" } & Params> {
  return defineWidePropertyRule("StringOrNumber", params)
}
