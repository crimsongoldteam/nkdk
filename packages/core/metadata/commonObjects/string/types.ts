import { Static, Type } from "@sinclair/typebox"
import type { BasePropertyRule } from "~/metadata/orchestration/property/types"

export const StringJSONSchema = Type.String()

export type StringYAML = Static<typeof StringJSONSchema>

export interface StringPropertyRule extends BasePropertyRule {
  type: "string"
}

export type StringRuleParams = Omit<StringPropertyRule, "type">

export function stringRule<const Params extends StringRuleParams>(
  params: Params = {} as Params
): Readonly<{ type: "string" } & Params> {
  return { type: "string", ...params }
}
