import { ConfigurationContext } from "~/metadata/context/types"
import { excludeNameFromI8nText } from "~/metadata/helpers/synonymHelpers"
import { ExportToYAMLFunctionNew, I8nTextPropertyRule, PropertyRule } from "~/metadata/orchestration"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { I8nText, I8nTextYAML } from "./types"

export const exportI8nTextToYAML: ExportToYAMLFunctionNew = (params: {
  context: ConfigurationContext
  rule: PropertyRule
  value: I8nText | undefined
  name?: string
}): I8nTextYAML | undefined => {
  const { context, rule, value: text, name } = params

  if (!context.exportToYAML) throw new Error("context.exportToYAML is required")

  const i8nRule = rule as I8nTextPropertyRule
  const toTyped = context.exportToYAML?.toTyped
  const yamlPartialOthers = toTyped ? undefined : i8nRule.yamlPartialOthers

  const textClean = getTextWithoutName({ context, rule: i8nRule, text, name })

  if (yamlPartialOthers) {
    return exportI8nTextOtherToYAML(context, textClean)
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
  if (!name) throw new Error("name is required for excludeIfEqualNameYAML")

  return excludeNameFromI8nText(context, text, name)
}

const exportFullI8nTextToYAML = (
  context: ConfigurationContext,
  title: I8nText | undefined
): I8nTextYAML | undefined => {
  if (!title) return undefined
  if (Object.keys(title.items).length === 0) return undefined

  const defaultLanguage = context.defaultLanguage

  const items = title.items

  if (Object.keys(items).length === 1 && items[defaultLanguage] !== undefined) return items[defaultLanguage]

  return items
}

const exportI8nTextOtherToYAML = (
  context: ConfigurationContext,
  text: I8nText | undefined
): I8nTextYAML | undefined => {
  if (!text) return undefined

  const defaultLanguage = context.defaultLanguage

  const filtredItems = Object.fromEntries(Object.entries(text.items).filter(([lang]) => lang !== defaultLanguage))

  return exportFullI8nTextToYAML(context, { items: filtredItems })
}

registerTypeRule("I8nText", "exportToYAML", exportI8nTextToYAML)
