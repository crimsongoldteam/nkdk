import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import { ConfigurationContext } from "@nkdk/runtime"
import type { I8nText, I8nTextLanguageXML, I8nTextPropertyRule, I8nTextXML } from "./types"
import { importLocalizedItems } from "./anomalies"

export const importI8nTextFromXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule,
  xml: I8nTextXML | "" | undefined
): I8nText | undefined => {
  const narrowRule = _rule as I8nTextPropertyRule

  if (xml === "") {
    return narrowRule.preserveEmptyXML || narrowRule.excludeIfEqualNameYAML ? { items: {} } : undefined
  }
  if (!xml) return undefined

  if (!xml["v8:item"]) {
    return narrowRule.preserveEmptyXML || narrowRule.excludeIfEqualNameYAML ? { items: {} } : undefined
  }

  const items: I8nTextLanguageXML[] = Array.isArray(xml["v8:item"]) ? xml["v8:item"] : [xml["v8:item"]]

  if (items.length === 0) return undefined

  return { items: importLocalizedItems({ context: _context, items }) }
}

export const metadataPropertyRule000 = definePropertyTypeRule("I8nText", "importFromXML", importI8nTextFromXML)
export const metadataPropertyRule001 = definePropertyTypeRule("I8nText", "xmlImportPropertyBehavior", {
  explicitEmptyValue: ({ rule }) =>
    rule.excludeIfEqualNameYAML === true ? { items: {} } : undefined,
})
