import { ConfigurationContext } from "~/metadata/context/types"
import { importI8nTextFromEnterprise } from "../i8nText/importFromEnterprise"
import { I8nText } from "../i8nText/types"
import { FormattedI8nText, FormattedI8nTextEnterprise } from "./types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory/typeRulesFactory"

export const importFormattedI8nTextFromEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  text: FormattedI8nTextEnterprise | undefined,
  formattedText: FormattedI8nTextEnterprise | undefined
): FormattedI8nText | undefined => {
  if (text === undefined && formattedText === undefined) return undefined

  const textValue = formattedText ? formattedText : text
  const textResult = importI8nTextFromEnterprise(context, undefined, textValue)!

  const result: FormattedI8nText = {
    formatted: formattedText !== undefined,
    items: textResult.items,
  }

  return result
}

export const importFormattedI8nTextCombinedFromEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  source: I8nText | undefined,
  text: FormattedI8nTextEnterprise | undefined,
  formattedText: FormattedI8nTextEnterprise | undefined
): FormattedI8nText | undefined => {
  if (source === undefined && text === undefined && formattedText === undefined) return undefined

  const result: FormattedI8nText = {
    items: {},
    formatted: false,
  }

  if (source !== undefined) {
    result.items = { ...result.items, ...source.items }
  }

  if (text !== undefined || formattedText !== undefined) {
    const otherLanguages = importFormattedI8nTextFromEnterprise(context, undefined, text, formattedText)!
    result.items = { ...result.items, ...otherLanguages.items }
    result.formatted = otherLanguages.formatted
  }

  if (Object.keys(result.items).length === 0) return undefined

  return result
}


registerTypeRule("FormattedI8nText", "importFromEnterprise", importFromEnterprise)