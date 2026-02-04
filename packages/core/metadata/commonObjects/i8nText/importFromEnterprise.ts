import { ConfigurationContext } from "~/metadata/context/types"
import { I8nText, I8nTextEnterprise } from "./types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory/typeRulesFactory"

export const importI8nTextFromEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: I8nTextEnterprise | undefined
): I8nText | undefined => {
  if (data === undefined) return undefined

  if (typeof data === "string") {
    return {
      items: {
        [context.defaultLanguage]: data,
      },
    }
  }

  return {
    items: data,
  }
}

export const importI8nTextCombinedFromEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  defaultLanguage: I8nText | undefined,
  otherLanguagesEnterprise: I8nTextEnterprise | undefined
): I8nText | undefined => {
  if (defaultLanguage === undefined && otherLanguagesEnterprise === undefined) return undefined

  const result: I8nText = {
    items: {},
  }

  if (defaultLanguage !== undefined) {
    result.items = { ...result.items, ...defaultLanguage.items }
  }

  if (otherLanguagesEnterprise !== undefined) {
    const otherLanguages = importI8nTextFromEnterprise(context, undefined, otherLanguagesEnterprise)!
    result.items = { ...result.items, ...otherLanguages.items }
  }

  if (Object.keys(result.items).length === 0) return undefined

  return result
}


registerTypeRule("I8nText", "importFromEnterprise", importFromEnterprise)