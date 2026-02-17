import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { FormattedI8nTextPropertyRule, ImportFromYAMLFunctionNew, registerTypeRule } from "~/metadata/metadataFactory"
import { importI8nTextFromEnterprise } from "../i8nText/importFromEnterprise"
import { I8nText } from "../i8nText/types"
import { FormattedI8nText, FormattedI8nTextEnterprise } from "./types"

export const importFormattedI8nTextFromYAML: ImportFromYAMLFunctionNew = (params: {
  context: ConfigurationContext
  rule: PropertyRule<any>
  value: FormattedI8nTextEnterprise | undefined
  yaml?: Record<string, any> | undefined
  source?: I8nText | undefined
}): FormattedI8nText | undefined => {
  const { context, rule, value: text, yaml, source } = params
  const narrowRule = rule as FormattedI8nTextPropertyRule<any>
  const formattedText = yaml ? yaml[narrowRule.yamlFormatted] : undefined

  if (source === undefined && text === undefined && formattedText === undefined) return undefined

  const result: FormattedI8nText = {
    items: {},
    formatted: false,
  }

  if (source !== undefined) {
    result.items = { ...result.items, ...source.items }
  }

  if (text !== undefined || formattedText !== undefined) {
    const otherLanguages = importFromEnterprise(context, rule, text, formattedText)!
    result.items = { ...result.items, ...otherLanguages.items }
    result.formatted = otherLanguages.formatted
  }

  if (Object.keys(result.items).length === 0) return undefined

  return result
}

const importFromEnterprise = (
  context: ConfigurationContext,
  rule: PropertyRule<any>,
  text: FormattedI8nTextEnterprise | undefined,
  formattedText: FormattedI8nTextEnterprise | undefined
): FormattedI8nText | undefined => {
  if (text === undefined && formattedText === undefined) return undefined

  const textValue = formattedText ? formattedText : text
  const textResult = importI8nTextFromEnterprise(context, rule, textValue)!

  const result: FormattedI8nText = {
    formatted: formattedText !== undefined,
    items: textResult.items,
  }

  return result
}

registerTypeRule("FormattedI8nText", "importFromEnterprise", importFormattedI8nTextFromYAML)
