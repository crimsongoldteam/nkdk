import { ConfigurationContext } from "../../context/types"
import { excludeNameFromI8nText } from "../../helpers/synonymHelpers"
import { ExportToYAMLFunctionNew, PropertyRule } from "../../orchestration"
import { registerTypeRule } from "../../orchestration/property/typeRuleRegistry"
import { I8nText, I8nTextPropertyRule, I8nTextYAML } from "./types"

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

  if (i8nRule.preserveEmptyXML && textClean !== undefined && Object.keys(textClean.items).length === 0) {
    return ""
  }

  return exportFullI8nTextToYAML(context, textClean)
}

export const exportI8nTextDefaultToYAML = (
  context: ConfigurationContext,
  title: I8nText | undefined
): string | undefined => {
  if (!title) return undefined

  const defaultLanguage = context.defaultLanguage

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

  return excludeNameFromI8nText(context, text, name)
}

const exportFullI8nTextToYAML = (
  context: ConfigurationContext,
  title: I8nText | undefined
): I8nTextYAML | undefined => {
  if (!title) return undefined
  if (!title.items) return undefined

  const defaultLanguage = context.defaultLanguage
  const items = title.items
  const languages = Object.keys(items)

  if (languages.length === 0) return undefined
  if (languages.length === 1 && items[defaultLanguage] !== undefined) return items[defaultLanguage]

  return items
}

registerTypeRule("I8nText", "exportToYAML", exportI8nTextToYAML)
