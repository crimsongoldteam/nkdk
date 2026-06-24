import { ConfigurationContext } from "~/metadata/context/types"
import { ImportFromYAMLFunctionNew, PropertyRule, registerTypeRule } from "~/metadata/orchestration"
import { importI8nTextFromYAML } from "../i8nText/fromYAML"
import { I8nText } from "../i8nText/types"
import { FormattedI8nText, FormattedI8nTextValueYAML } from "./types"

export const importFormattedI8nTextFromYAML: ImportFromYAMLFunctionNew = (params: {
  context: ConfigurationContext
  rule: PropertyRule
  value: FormattedI8nTextValueYAML | undefined
  yaml?: Record<string, any> | undefined
  source?: I8nText | undefined
}): FormattedI8nText | undefined => {
  const { context, rule, value, source } = params

  if (source === undefined && value === undefined) return undefined

  const result: FormattedI8nText = {
    items: {},
    formatted: false,
  }

  if (source !== undefined) {
    result.items = { ...result.items, ...source.items }
    const formattedSource = source as FormattedI8nText
    if (formattedSource.formatted !== undefined) {
      result.formatted = formattedSource.formatted
    }
  }

  if (value !== undefined) {
    const otherLanguages = importFromYAML(context, rule, value)!
    result.items = { ...result.items, ...otherLanguages.items }
    result.formatted = otherLanguages.formatted
  }

  if (Object.keys(result.items).length === 0) return undefined

  return result
}

const importFromYAML = (
  context: ConfigurationContext,
  rule: PropertyRule,
  value: FormattedI8nTextValueYAML | undefined
): FormattedI8nText | undefined => {
  if (value === undefined) return undefined

  const textResult = importI8nTextFromYAML({ context, rule, value: value.Текст })
  if (textResult === undefined) return undefined

  const result: FormattedI8nText = {
    formatted: value.Форматированный === "Истина",
    items: textResult.items,
  }

  return result
}

registerTypeRule("FormattedI8nText", "importFromYAML", importFormattedI8nTextFromYAML)
