import type { XmlAnomalyValidationState } from "@nkdk/runtime"

export function encodeXmlAnomalyState(state: XmlAnomalyValidationState | undefined): 0 | 1 | 2 {
  if (state === undefined) return 0
  return state === "pending" ? 1 : 2
}

export function decodeXmlAnomalyState(value: number): XmlAnomalyValidationState | undefined {
  if (value === 0) return undefined
  if (value === 1) return "pending"
  if (value === 2) return "accepted"
  throw new Error(`Неизвестное состояние XML-границы: ${value}`)
}
