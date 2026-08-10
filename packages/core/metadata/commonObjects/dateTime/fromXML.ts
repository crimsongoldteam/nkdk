import type { PropertyRule } from "../../ruleRuntime/property/types"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import { ConfigurationContext } from "../../context/types"

type DateTimeXML = string | { "#text"?: string; "_xsi:type"?: string } | undefined

export const importDateTimeFromXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  value: DateTimeXML
): string | undefined => {
  if (value === undefined) return undefined

  const rawValue = typeof value === "object" && value !== null && "#text" in value ? value["#text"] : value
  if (rawValue === undefined || rawValue === "") return undefined

  return String(rawValue)
}

export const metadataPropertyRule000 = definePropertyTypeRule("dateTime", "importFromXML", importDateTimeFromXML)
