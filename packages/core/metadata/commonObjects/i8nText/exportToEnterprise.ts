import { ConfigurationContext } from "~/metadata/context/types"
import { I8nText, I8nTextEnterprise } from "./types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"

export const exportI8nTextToEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  title: I8nText | undefined
): I8nTextEnterprise | undefined => {
  if (!title) return undefined
  if (Object.keys(title.items).length === 0) return undefined

  const defaultLanguage = context.defaultLanguage

  const items = title.items

  if (Object.keys(items).length === 1 && items[defaultLanguage] !== undefined) return items[defaultLanguage]

  return items
}

export const exportI8nTextDefaultToEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  title: I8nText | undefined
): string | undefined => {
  if (!title) return undefined

  const defaultLanguage = context.defaultLanguage

  return title.items[defaultLanguage]
}

export const exportI8nTextOtherToEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  text: I8nText | undefined
): I8nTextEnterprise | undefined => {
  if (!text) return undefined

  const defaultLanguage = context.defaultLanguage

  const filtredItems = Object.fromEntries(Object.entries(text.items).filter(([lang]) => lang !== defaultLanguage))

  return exportI8nTextToEnterprise(context, undefined, { items: filtredItems })
}
