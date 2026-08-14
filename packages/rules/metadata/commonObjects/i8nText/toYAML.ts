import {
  ConfigurationContext,
  copyYAMLScalarTags,
  yamlMappingTagOf,
  yamlScalarTagAt,
} from "@nkdk/runtime"
import { excludeNameFromI8nText } from "../../helpers/synonymHelpers"
import { ExportToYAMLFunctionNew, PropertyRule } from "../../ruleRuntime"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import { I8nText, I8nTextPropertyRule, I8nTextYAML } from "./types"
import { copyLocalizedItemTags } from "./anomalies"

export const exportI8nTextToYAML: ExportToYAMLFunctionNew = (params: {
  context: ConfigurationContext
  rule: PropertyRule
  value: I8nText | undefined
  name?: string
}): I8nTextYAML | undefined => {
  const { context, rule, value: text, name } = params

  if (!context.exportToYAML) throw new Error("context.exportToYAML is required")

  const i8nRule = rule as I8nTextPropertyRule
  const textClean = getTextWithoutName({ context, rule: i8nRule, text, name })

  if (
    (i8nRule.preserveEmptyXML || i8nRule.excludeIfEqualNameYAML) &&
    textClean !== undefined &&
    Object.keys(textClean.items).length === 0
  ) {
    return ""
  }

  if (
    i8nRule.excludeIfEqualNameYAML &&
    text !== undefined &&
    Object.keys(text.items).length > 0 &&
    text.items[context.languages.default] === undefined &&
    yamlMappingTagOf(text.items) !== "xml/order"
  ) {
    const items = { [context.languages.default]: "", ...(textClean?.items ?? {}) }
    if (textClean !== undefined) copyYAMLScalarTags(textClean.items, items)
    return items
  }

  return exportFullI8nTextToYAML(context, textClean)
}

export const exportI8nTextDefaultToYAML = (
  context: ConfigurationContext,
  title: I8nText | undefined
): string | undefined => {
  if (!title) return undefined

  const defaultLanguage = context.languages.default

  return title.items[defaultLanguage]
}

const getTextWithoutName = (params: {
  context: ConfigurationContext

  rule: I8nTextPropertyRule
  text: I8nText | undefined
  name?: string
}): I8nText | undefined => {
  const { context, rule, text, name } = params
  if (text === undefined) return undefined
  if (!rule.excludeIfEqualNameYAML) return text
  if (!name) return text

  if (
    yamlMappingTagOf(text.items) === "xml/order" ||
    yamlScalarTagAt(text.items, context.languages.default) === "xml/duplicate"
  ) {
    return text
  }

  const result = excludeNameFromI8nText(context, text, name)
  if (result !== undefined && result.items !== text.items) copyLocalizedItemTags(text.items, result.items)
  return result
}

const exportFullI8nTextToYAML = (
  context: ConfigurationContext,
  title: I8nText | undefined
): I8nTextYAML | undefined => {
  if (!title) return undefined
  if (!title.items) return undefined

  const defaultLanguage = context.languages.default
  const items = title.items
  const languages = Object.keys(items)

  if (languages.length === 0) return undefined
  if (
    languages.length === 1 &&
    items[defaultLanguage] !== undefined &&
    yamlScalarTagAt(items, defaultLanguage) === undefined
  ) return items[defaultLanguage]

  if (yamlMappingTagOf(items) === "xml/order") return items
  if (languages.some((language) => language === "" || language === "#")) return items

  const canonicalLanguages = [
    ...(languages.includes(defaultLanguage) ? [defaultLanguage] : []),
    ...languages.filter((language) => language !== defaultLanguage).sort(),
  ]
  if (canonicalLanguages.every((language, index) => language === languages[index])) return items

  const canonicalItems = Object.fromEntries(canonicalLanguages.map((language) => [language, items[language]]))
  copyYAMLScalarTags(items, canonicalItems)

  return canonicalItems
}

export const metadataPropertyRule000 = definePropertyTypeRule("I8nText", "exportToYAML", exportI8nTextToYAML)
