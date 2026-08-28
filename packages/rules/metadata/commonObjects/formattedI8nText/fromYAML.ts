import { ConfigurationContext } from "@nkdk/runtime"
import { ImportFromYAMLFunctionNew, PropertyRule, definePropertyTypeRule } from "../../ruleRuntime"
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
  if (
    value?.Форматированный === "Истина" &&
    !("Текст" in value)
  ) {
    return { formatted: true, items: {} }
  }
  const textResult = importI8nTextFromYAML({
    context,
    rule,
    value: value === undefined || !("Текст" in value) ? undefined : value.Текст,
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

export const metadataPropertyRule000 = definePropertyTypeRule("FormattedI8nText", "importFromYAML", importFormattedI8nTextFromYAML)
