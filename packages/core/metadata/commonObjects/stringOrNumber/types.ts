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
