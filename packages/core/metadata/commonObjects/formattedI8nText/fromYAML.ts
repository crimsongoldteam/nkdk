import { ConfigurationContext } from "~/metadata/context/types"
import { ImportFromYAMLFunctionNew, PropertyRule, registerTypeRule } from "~/metadata/orchestration"
import { importI8nTextFromYAML } from "../i8nText/fromYAML"
import { I8nText } from "../i8nText/types"
import { FormattedI8nText, FormattedI8nTextPropertyRule, FormattedI8nTextYAML } from "./types"

export const importFormattedI8nTextFromYAML: ImportFromYAMLFunctionNew = (params: {
  context: ConfigurationContext
  rule: PropertyRule
  value: FormattedI8nTextYAML | undefined
  yaml?: Record<string, any> | undefined
  source?: I8nText | undefined
}): FormattedI8nText | undefined => {
  const { context, rule, value: text, yaml, source } = params
  const narrowRule = rule as FormattedI8nTextPropertyRule
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
    const otherLanguages = importFromYAML(context, rule, text, formattedText)!
    result.items = { ...result.items, ...otherLanguages.items }
    result.formatted = otherLanguages.formatted
  }

  if (Object.keys(result.items).length === 0) return undefined

  return result
}

const importFromYAML = (
  context: ConfigurationContext,
  rule: PropertyRule,
  text: FormattedI8nTextYAML | undefined,
  formattedText: FormattedI8nTextYAML | undefined
): FormattedI8nText | undefined => {
  if (text === undefined && formattedText === undefined) return undefined

  const textValue = formattedText ? formattedText : text
  const textResult = importI8nTextFromYAML({ context, rule, value: textValue })!

  const result: FormattedI8nText = {
    formatted: formattedText !== undefined,
    items: textResult.items,
  }

  return result
}

registerTypeRule("FormattedI8nText", "importFromYAML", importFormattedI8nTextFromYAML)
