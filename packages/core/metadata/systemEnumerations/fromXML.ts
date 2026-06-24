import { ConfigurationContext } from "../context/types"
import { PropertyRule } from "../forms/elements/calendarField/rules"
import { registerTypeRule } from "../orchestration/property/typeRuleRegistry"

export const importSystemEnumerationFromXML = <T extends string>(
  _context: ConfigurationContext,
  _rule: PropertyRule,
  value: T | { "#text"?: T; [key: string]: unknown } | undefined
): T | undefined => {
  if (value === undefined) return undefined
  if (typeof value === "object" && value !== null && "#text" in value) {
    return value["#text"]
  }
  return value as T
}

registerTypeRule("SystemEnumeration", "importFromXML", importSystemEnumerationFromXML)
