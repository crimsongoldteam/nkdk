import { definePropertyTypeRule } from "../../ruleRuntime/property/propertyRuleRegistrySet"
import "./registry.types"
import { ConfigurationContext } from "@nkdk/runtime"
import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { isEmptyI8nText } from "./helper"
import type { I8nText, I8nTextLanguageXML, I8nTextPropertyRule, I8nTextXML } from "./types"
import { exportLocalizedItems } from "./anomalies"

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
    if (narrowRule.preserveEmptyXML || narrowRule.excludeIfEqualNameYAML) {
      return {}
    }
  }

  const v8Items: I8nTextLanguageXML[] = exportLocalizedItems({
    context,
    items: data.items,
    emptyDefaultIsMarker: narrowRule.excludeIfEqualNameYAML === true,
  })

  const base: I8nTextXML = { "v8:item": v8Items }
  if (narrowRule.typedXML) {
    return { "_xsi:type": "v8:LocalStringType", ...base }
  }
  return base
}

export const metadataPropertyRule000 = definePropertyTypeRule("I8nText", "exportToXML", exportI8nTextToXML)
