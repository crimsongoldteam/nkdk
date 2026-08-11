import type { PropertyRule } from "../../../ruleRuntime"

export const typedNumberRule = {
  type: "number",
  typedXML: true,
} as const satisfies PropertyRule

export const typedNumberValue = 1
