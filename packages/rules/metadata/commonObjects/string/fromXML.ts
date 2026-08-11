import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import { ConfigurationContext } from "@nkdk/runtime"

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

export const metadataPropertyRule000 = definePropertyTypeRule("string", "importFromXML", importStringFromXML)
