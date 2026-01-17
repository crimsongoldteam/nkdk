import { ConfigurationContext } from "~/metadata/context/types"
import { importI8nTextFromEnterprise } from "../i8nText/importFromEnterprise"
import { FormattedI8nText, FormattedI8nTextEnterprise } from "./types"

export const importFormattedI8nTextFromEnterprise = (
  context: ConfigurationContext,
  text: FormattedI8nTextEnterprise | undefined,
  formattedText: FormattedI8nTextEnterprise | undefined
): FormattedI8nText | undefined => {
  if (text === undefined && formattedText === undefined) return undefined

  const textValue = formattedText ? formattedText : text
  const textResult = importI8nTextFromEnterprise(context, textValue)!

  const result: FormattedI8nText = {
    formatted: formattedText !== undefined,
    items: textResult.items,
  }

  return result
}

export const importFormattedI8nTextCombinedFromEnterprise = (
  context: ConfigurationContext,
  defaultLanguage: FormattedI8nText | undefined,
  text: FormattedI8nTextEnterprise | undefined,
  formattedText: FormattedI8nTextEnterprise | undefined
): FormattedI8nText | undefined => {
  if (defaultLanguage === undefined && text === undefined && formattedText === undefined) return undefined

  const result: FormattedI8nText = {
    items: {},
    formatted: false,
  }

  if (defaultLanguage !== undefined) {
    result.items = { ...result.items, ...defaultLanguage.items }
  }

  if (text !== undefined || formattedText !== undefined) {
    const otherLanguages = importFormattedI8nTextFromEnterprise(context, text, formattedText)!
    result.items = { ...result.items, ...otherLanguages.items }
  }

  if (Object.keys(result.items).length === 0) return undefined

  return result
}
