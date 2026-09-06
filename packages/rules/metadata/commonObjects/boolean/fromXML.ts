import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import { ConfigurationContext, type XmlElementNode } from "@nkdk/runtime"
import type { StringboolXML } from "./types"
import { readBooleanXML } from "./xmlValue"

export const importBooleanFromXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  xml: StringboolXML | { "#text"?: StringboolXML; [key: string]: unknown } | XmlElementNode | undefined
): boolean | undefined => readBooleanXML(xml)

export const metadataPropertyRule000 = definePropertyTypeRule("boolean", "importFromXML", importBooleanFromXML)
