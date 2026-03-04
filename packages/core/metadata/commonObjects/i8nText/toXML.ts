import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { isEmptyI8nText } from "./helper"
import { I8nText, I8nTextLanguageXML, I8nTextPropertyRule, I8nTextXML } from "./types"

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

  if (narrowRule.skipEmptyToXML && isEmptyI8nText(context, data)) {
    return undefined
  }

  const v8Items: I8nTextLanguageXML[] = []
  Object.entries(data.items).forEach(([lang, content]) => {
    v8Items.push({ "v8:lang": lang, "v8:content": content })
  })

  return { "v8:item": v8Items }
}

registerTypeRule("I8nText", "exportToXML", exportI8nTextToXML)
