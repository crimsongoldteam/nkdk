import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import { ConfigurationContext, type XmlElementNode } from "@nkdk/runtime"
import { readStringXML } from "./xmlValue"

export const importStringFromXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  value: string | number | { "#text"?: string; "_xsi:type"?: string } | XmlElementNode | undefined
): string | undefined => {
  if (value === null) throw new TypeError("Строковое значение XML не может быть null")
  return readStringXML(value)
}

export const metadataPropertyRule000 = definePropertyTypeRule("string", "importFromXML", importStringFromXML)
