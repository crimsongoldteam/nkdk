import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import { importI8nTextFromXML } from "../i8nText/fromXML"
import type { FormattedI8nText, FormattedI8nTextXML } from "./types"
import { ConfigurationContextFromXML, isXmlElementNode, xmlAttributeValue, type XmlElementNode } from "@nkdk/runtime"

export const importFormattedI8nTextFromXML = (
  context: ConfigurationContextFromXML,
  rule: PropertyRule,
  xml: FormattedI8nTextXML | XmlElementNode | undefined
): FormattedI8nText | undefined => {
  if (xml === undefined) return undefined

  const formattedXML = isXmlElementNode(xml) ? xmlAttributeValue(xml, "formatted") : xml._formatted
  const formatted = formattedXML === true || formattedXML === "true"
  const resultI8nText = importI8nTextFromXML(context, rule, xml)

  if (resultI8nText === undefined) {
    if (formattedXML === undefined) return undefined
    return {
      formatted,
      items: {},
    }
  }

  return {
    formatted,
    items: resultI8nText.items,
  }
}

export const metadataPropertyRule000 = definePropertyTypeRule("FormattedI8nText", "importFromXML", importFormattedI8nTextFromXML)
export const metadataPropertyRule001 = definePropertyTypeRule("FormattedI8nText", "xmlImportPropertyBehavior", {
  explicitEmptyValue: ({ rule }) =>
    rule.excludeIfEqualNameYAML === true
      ? { formatted: false, items: {} }
      : undefined,
})
