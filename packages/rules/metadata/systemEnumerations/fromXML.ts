import { ConfigurationContext, type XmlElementNode } from "@nkdk/runtime"
import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { definePropertyTypeRule } from "../ruleRuntime/property/typeRuleRegistry"
import * as SE from "./types"
import { applySystemEnumerationXMLAlias } from "./xmlAliases"
import { readSystemEnumerationXMLText } from "./xmlValue"

export const importSystemEnumerationFromXML = <T extends string>(
  _context: ConfigurationContext,
  _rule: PropertyRule,
  value: T | { "#text"?: T; [key: string]: unknown } | XmlElementNode | undefined
): T | undefined => {
  const raw = readSystemEnumerationXMLText(value)
  if (raw === undefined) return undefined
  const type = (_rule as SE.SystemEnumerationPropertyRule).typeSE
  return applySystemEnumerationXMLAlias(type, "fromXML", raw) as T
}

export const metadataPropertyRule000 = definePropertyTypeRule("SystemEnumeration", "importFromXML", importSystemEnumerationFromXML)
