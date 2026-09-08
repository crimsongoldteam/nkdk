import { ConfigurationContext } from "@nkdk/runtime"
import { ImportFromYAMLFunctionNew, PropertyRule, definePropertyTypeRule } from "../../ruleRuntime"
import { importI8nTextFromYAML } from "../i8nText/fromYAML"
import { FormattedI8nText, FormattedI8nTextValueYAML } from "./types"

export const importFormattedI8nTextFromYAML: ImportFromYAMLFunctionNew = (params: {
  context: ConfigurationContext
  rule: PropertyRule
  value: FormattedI8nTextValueYAML | undefined
  yaml?: Record<string, any> | undefined
  name?: string
  restoreExcludedEqualName?: boolean
}): FormattedI8nText | undefined => {
  const { context, rule, value, name, restoreExcludedEqualName } = params
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
    name,
    restoreExcludedEqualName,
  })
  if (textResult === undefined) return undefined
  return {
    formatted: value?.Форматированный === "Истина",
    items: textResult.items,
  }
}

export const metadataPropertyRule000 = definePropertyTypeRule("FormattedI8nText", "importFromYAML", importFormattedI8nTextFromYAML)
