import "./registry.types"
import { ConfigurationContext } from "../../context/types"
import type { PropertyRule } from "../../orchestration/property/types"
import { registerTypeRule } from "../../orchestration/property/typeRuleRegistry"
import { isEmptyI8nText } from "./helper"
import "./registerPropertyType"
import type { I8nText, I8nTextLanguageXML, I8nTextPropertyRule, I8nTextXML } from "./types"

/** @deprecated */
export const exportI8nTextToXMLWithDefaultLanguage = (
  context: ConfigurationContext,
  rule: PropertyRule,
  data: I8nText | undefined
): I8nTextXML | undefined => {
  if (!data) return undefined

  if (isEmptyI8nText(context, data)) {
    return undefined
  }

  return exportI8nTextToXML(context, rule, data)
}

export const exportI8nTextToXML = (
  context: ConfigurationContext,
  rule: PropertyRule,
  data: I8nText | undefined
): I8nTextXML | undefined => {
  if (!data) return undefined

  const narrowRule = rule as I8nTextPropertyRule

  if (isEmptyI8nText(context, data)) {
    if (narrowRule.skipEmptyToXML) {
      return undefined
    }
    if (narrowRule.emptyAsRawXML) {
      return {}
    }
  }

  const v8Items: I8nTextLanguageXML[] = []
  Object.entries(data.items).forEach(([lang, content]) => {
    v8Items.push({ "v8:lang": lang, "v8:content": content })
  })

  const base: I8nTextXML = { "v8:item": v8Items }
  if (narrowRule.typedXML) {
    return { "_xsi:type": "v8:LocalStringType", ...base }
  }
  return base
}

registerTypeRule("I8nText", "exportToXML", exportI8nTextToXML)
