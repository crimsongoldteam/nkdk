import { definePropertyRule, type ExactRuleParams } from "~/metadata/commonObjects/ruleBuilder"
import type { BasePropertyRule } from "~/metadata/orchestration/property/types"

export interface UuidPropertyRule extends BasePropertyRule {
  type: "uuid"
}

export type UuidRuleParams = Omit<UuidPropertyRule, "type">

export function uuidRule(): Readonly<{ type: "uuid" }>
export function uuidRule<const Params extends UuidRuleParams>(
  params: ExactRuleParams<UuidRuleParams, Params>
): Readonly<{ type: "uuid" } & Params>
export function uuidRule(params: UuidRuleParams = {}): Readonly<{ type: "uuid" } & UuidRuleParams> {
  return definePropertyRule("uuid", params)
}
