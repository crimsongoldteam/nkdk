import { Type } from "@sinclairtypebox"
import type { Static } from "@sinclairtypebox"
import { definePropertyRule, type ExactRuleParams } from "../ruleBuilder"
import type { BasePropertyRule } from "../../orchestration/property/types"

export const StringJSONSchema = Type.String()

export type StringYAML = Static<typeof StringJSONSchema>

export interface StringPropertyRule extends BasePropertyRule {
  type: "string"
}

export type StringRuleParams = Omit<StringPropertyRule, "type">

export function stringRule(): Readonly<{ type: "string" }>
export function stringRule<const Params extends StringRuleParams>(
  params: ExactRuleParams<StringRuleParams, Params>
): Readonly<{ type: "string" } & Params>
export function stringRule(params: StringRuleParams = {}): Readonly<{ type: "string" } & StringRuleParams> {
  return definePropertyRule("string", params)
}
