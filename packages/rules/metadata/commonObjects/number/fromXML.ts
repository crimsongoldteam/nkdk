import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import { ConfigurationContext, type XmlElementNode } from "@nkdk/runtime"
import { readNumberXML } from "./xmlValue"

type NumberXML = number | string | { "#text"?: number | string; "_xsi:type"?: string } | XmlElementNode | undefined

export const importNumberFromXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  value: NumberXML
): number | undefined => readNumberXML(value)

export const metadataPropertyRule000 = definePropertyTypeRule("number", "importFromXML", importNumberFromXML)
export const metadataPropertyRule001 = definePropertyTypeRule("number", "configurationIndexValueFromXML", {
})
