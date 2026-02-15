import { ConfigurationContext } from "~/metadata/context/types"
import { I8nTextPropertyRule, PropertyRule } from "~/metadata/metadataFactory"
import { registerTypeRule } from "~/metadata/metadataFactory/types/types"
import { I8nText, I8nTextEnterprise } from "./types"

export const exportI8nTextToYAML = (
  context: ConfigurationContext,
  rule: PropertyRule<any>,
  title: I8nText | undefined
): I8nTextEnterprise | undefined => {
  if ((rule as I8nTextPropertyRule<any>).yamlPartialOthers) {
    return exportI8nTextOtherToEnterprise(context, title)
  }

  return exportFullI8nTextToYAML(context, title)
}

export const exportI8nTextDefaultToEnterprise = (
  context: ConfigurationContext,
  title: I8nText | undefined
): string | undefined => {
  if (!title) return undefined

  const defaultLanguage = context.defaultLanguage

  return title.items[defaultLanguage]
}

const exportFullI8nTextToYAML = (
  context: ConfigurationContext,
  title: I8nText | undefined
): I8nTextEnterprise | undefined => {
  if (!title) return undefined
  if (Object.keys(title.items).length === 0) return undefined

  const defaultLanguage = context.defaultLanguage

  const items = title.items

  if (Object.keys(items).length === 1 && items[defaultLanguage] !== undefined) return items[defaultLanguage]

  return items
}

const exportI8nTextOtherToEnterprise = (
  context: ConfigurationContext,
  text: I8nText | undefined
): I8nTextEnterprise | undefined => {
  if (!text) return undefined

  const defaultLanguage = context.defaultLanguage

  const filtredItems = Object.fromEntries(Object.entries(text.items).filter(([lang]) => lang !== defaultLanguage))

  return exportFullI8nTextToYAML(context, { items: filtredItems })
}

registerTypeRule("I8nText", "exportToEnterprise", exportI8nTextToYAML)
