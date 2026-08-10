import type { PropertyRule } from "../../ruleRuntime/property/types"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import { ConfigurationContext } from "../../context/types"
import type { StringboolXML } from "./types"

export const importBooleanFromXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  xml: StringboolXML | { "#text"?: StringboolXML; [key: string]: unknown } | undefined
): boolean | undefined => {
  if (xml === undefined) return undefined

  const value = typeof xml === "object" && xml !== null && "#text" in xml ? xml["#text"] : xml

  return value === "true" || value === true ? true : value === "false" || value === false ? false : undefined
}

export const metadataPropertyRule000 = definePropertyTypeRule("boolean", "importFromXML", importBooleanFromXML)
