import { Static, Type } from "@sinclair/typebox"
import { BasePropertyRule } from "~/metadata/orchestration"

export const PredefinedCodeJSONSchema = Type.Union([Type.String(), Type.Number()])

export type PredefinedCode = string | number
export type PredefinedCodeYAML = Static<typeof PredefinedCodeJSONSchema>

export interface PredefinedCodePropertyRule extends BasePropertyRule {
  type: "PredefinedCode"
}
