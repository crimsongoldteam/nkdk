import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { ConfigurationContext } from "../../context/types"
import { I8nText, I8nTextLanguageXML, I8nTextXML } from "./types"

export const _importI8nTextFromXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule,
  xml: I8nTextXML | undefined
): I8nText | undefined => {
  if (!xml) return undefined

  if (!xml["v8:item"]) return undefined

  const items: I8nTextLanguageXML[] = Array.isArray(xml["v8:item"]) ? xml["v8:item"] : [xml["v8:item"]]

  if (items.length === 0) return undefined

  const result: I8nText = {
    items: {},
  }

  for (const item of items) {
    const { "v8:lang": lang, "v8:content": content } = item
    result.items[lang] = content ?? ""
  }

  return result
}
