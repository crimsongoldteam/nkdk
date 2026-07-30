import { ConfigurationContext } from "../../context/types"
import { ImportFromYAMLFunctionNew, PropertyRule, registerTypeRule } from "../../orchestration"
import { importI8nTextFromYAML } from "../i8nText/fromYAML"
import { I8nText } from "../i8nText/types"
import { FormattedI8nText, FormattedI8nTextValueYAML } from "./types"

export const importFormattedI8nTextFromYAML: ImportFromYAMLFunctionNew = (params: {
  context: ConfigurationContext
  rule: PropertyRule
  value: FormattedI8nTextValueYAML | undefined
  yaml?: Record<string, any> | undefined
  source?: I8nText | undefined
  name?: string
  restoreExcludedEqualName?: boolean
}): FormattedI8nText | undefined => {
  const { context, rule, value, source, name, restoreExcludedEqualName } = params
  const textResult = importI8nTextFromYAML({
    context,
    rule,
    value: value?.Текст,
    source,
    name,
    restoreExcludedEqualName,
  })
  if (textResult === undefined) return undefined
  const formattedSource = source as FormattedI8nText | undefined
  return {
    formatted:
      value === undefined
        ? (formattedSource?.formatted ?? false)
        : value.Форматированный === "Истина",
    items: textResult.items,
  }
}

registerTypeRule("FormattedI8nText", "importFromYAML", importFormattedI8nTextFromYAML)
