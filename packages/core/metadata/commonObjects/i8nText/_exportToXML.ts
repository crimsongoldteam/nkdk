import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { ConfigurationContext } from "~/metadata/context/types"
import { isEmptyI8nText } from "./helper"
import { I8nText, I8nTextLanguageXML, I8nTextXML } from "./types"

export const _exportI8nTextToXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule,
  data: I8nText | undefined
): I8nTextXML | undefined => {
  if (!data) return undefined

  const v8Items: I8nTextLanguageXML[] = []
  Object.entries(data.items).forEach(([lang, content]) => {
    v8Items.push({ "v8:lang": lang, "v8:content": content })
  })

  return { "v8:item": v8Items }
}
