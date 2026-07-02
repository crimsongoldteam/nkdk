import type { PropertyRule } from "../../../orchestration"

export const typedDateTimeRule = {
  type: "dateTime",
  typedXML: true,
} as const satisfies PropertyRule

export const typedDateTimeValue = "2026-03-31T00:00:00"
