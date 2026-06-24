import type { PropertyRule } from "~/metadata/orchestration"

export const typedNumberRule = {
  type: "number",
  typedXML: true,
} as const satisfies PropertyRule

export const typedNumberValue = 1
