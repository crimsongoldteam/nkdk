import { ConfigurationContext } from "@nkdk/runtime"
import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { definePropertyTypeRule } from "../ruleRuntime/property/typeRuleRegistry"
import * as SE from "./types"
import { applySystemEnumerationXMLAlias } from "./xmlAliases"

export const importSystemEnumerationFromXML = <T extends string>(
  _context: ConfigurationContext,
  _rule: PropertyRule,
  value: T | { "#text"?: T; [key: string]: unknown } | undefined
): T | undefined => {
  if (value === undefined) return undefined
  const raw = typeof value === "object" && value !== null ? value["#text"] : value
  if (typeof raw !== "string") return undefined
  const type = (_rule as SE.SystemEnumerationPropertyRule).typeSE
  return applySystemEnumerationXMLAlias(type, "fromXML", raw) as T
}

export const metadataPropertyRule000 = definePropertyTypeRule("SystemEnumeration", "importFromXML", importSystemEnumerationFromXML)
