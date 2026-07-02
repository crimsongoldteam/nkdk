import { Type } from "@sinclair/typebox"
import type { Static } from "@sinclair/typebox"
import { definePropertyRule, type ExactRuleParams } from "../ruleBuilder"
import type { BasePropertyRule } from "../../orchestration/property/types"

export type StringboolXML = "true" | "false" | boolean

export const BooleanJSONSchema = Type.Union([Type.Literal("Истина"), Type.Literal("Ложь")])

export type StringboolYAML = Static<typeof BooleanJSONSchema>

export interface BooleanPropertyRule extends BasePropertyRule {
  type: "boolean"
}

export type BooleanRuleParams = Omit<BooleanPropertyRule, "type">

export function booleanRule(): Readonly<{ type: "boolean" }>
export function booleanRule<const Params extends BooleanRuleParams>(
  params: ExactRuleParams<BooleanRuleParams, Params>
): Readonly<{ type: "boolean" } & Params>
export function booleanRule(params: BooleanRuleParams = {}): Readonly<{ type: "boolean" } & BooleanRuleParams> {
  return definePropertyRule("boolean", params)
}
