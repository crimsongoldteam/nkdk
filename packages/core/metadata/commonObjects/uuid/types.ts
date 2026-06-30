import type { BasePropertyRule } from "~/metadata/orchestration"

export interface UuidPropertyRule extends BasePropertyRule {
  type: "uuid"
}

export type UuidRuleParams = Omit<UuidPropertyRule, "type">

export function uuidRule<const Params extends UuidRuleParams>(
  params: Params = {} as Params
): Readonly<{ type: "uuid" } & Params> {
  return { type: "uuid", ...params }
}
