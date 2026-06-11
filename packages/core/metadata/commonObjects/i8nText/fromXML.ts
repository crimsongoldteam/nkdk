import { PropertyRule } from "~/metadata/orchestration/property/types"
import { registerTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import { ConfigurationContext } from "../../context/types"
import { I8nText, I8nTextLanguageXML, I8nTextPropertyRule, I8nTextXML } from "./types"

export const importI8nTextFromXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule,
  xml: I8nTextXML | "" | undefined
): I8nText | undefined => {
  const narrowRule = _rule as I8nTextPropertyRule

  if (xml === "") return narrowRule.emptyAsRawXML ? { items: {} } : undefined
  if (!xml) return undefined

  if (!xml["v8:item"]) return narrowRule.emptyAsRawXML ? { items: {} } : undefined

  const items: I8nTextLanguageXML[] = Array.isArray(xml["v8:item"]) ? xml["v8:item"] : [xml["v8:item"]]

  if (items.length === 0) return undefined

  const result: I8nText = {
    items: {},
  }

  for (const item of items) {
    const { "v8:lang": lang, "v8:content": content } = item
    result.items[lang ?? ""] = content != null && content !== "" ? String(content) : ""
  }

  return result
}

registerTypeRule("I8nText", "importFromXML", importI8nTextFromXML)
