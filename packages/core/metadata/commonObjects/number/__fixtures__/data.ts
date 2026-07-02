import type { PropertyRule } from "../../../orchestration"

export const typedNumberRule = {
  type: "number",
  typedXML: true,
} as const satisfies PropertyRule

export const typedNumberValue = 1
