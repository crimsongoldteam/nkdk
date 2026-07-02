import type { PropertyRule } from "~/metadata/orchestration/property/types"
import { registerTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import { ConfigurationContext } from "../../context/types"

export const importStringFromXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  value: string | number | { "#text"?: string; "_xsi:type"?: string } | undefined
): string | undefined => {
  if (value === undefined) return undefined
  if (typeof value === "object" && value !== null && "#text" in value) {
    const text = (value as { "#text"?: string })["#text"]
    return text !== undefined ? String(text) : undefined
  }
  if (typeof value === "object" && value !== null) {
    return undefined
  }
  return value.toString()
}

registerTypeRule("string", "importFromXML", importStringFromXML)
