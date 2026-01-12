import { ConfigurationContext } from "~/metadata/context/types"
import { I8nText, I8nTextEnterprise } from "./types"

export const importI8nTextFromEnterprise = (
  context: ConfigurationContext,
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
  defaultLanguage: I8nText | undefined,
  otherLanguagesEnterprise: I8nTextEnterprise | undefined
): I8nText | undefined => {
  if (defaultLanguage === undefined && otherLanguagesEnterprise === undefined) return undefined

  const result: I8nText = {
    formatted: defaultLanguage?.formatted,
    items: {},
  }

  if (otherLanguagesEnterprise !== undefined) {
    const otherLanguages = importI8nTextFromEnterprise(context, otherLanguagesEnterprise)
    if (otherLanguages !== undefined) result.items = { ...result.items, ...otherLanguages.items }
  }

  return result
}
