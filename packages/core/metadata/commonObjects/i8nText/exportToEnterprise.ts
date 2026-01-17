import { ConfigurationContext } from "~/metadata/context/types"
import { I8nText, I8nTextEnterprise } from "./types"

export const exportI8nTextToEnterprise = (
  context: ConfigurationContext,
  title: I8nText | undefined
): I8nTextEnterprise | undefined => {
  if (!title) return undefined
  if (Object.keys(title.items).length === 0) return undefined

  const defaultLanguage = context.defaultLanguage

  const items = title.items

  if (Object.keys(items).length === 1 && items[defaultLanguage]) return items[defaultLanguage]

  return items
}

export const exportI8nTextDefaultToEnterprise = (
  context: ConfigurationContext,
  title: I8nText | undefined
): string | undefined => {
  if (!title) return undefined

  const defaultLanguage = context.defaultLanguage

  return title.items[defaultLanguage]
}

export const exportI8nTextOtherToEnterprise = (
  context: ConfigurationContext,
  text: I8nText | undefined
): I8nTextEnterprise | undefined => {
  if (!text) return undefined

  const defaultLanguage = context.defaultLanguage

  const filtredItems = Object.fromEntries(Object.entries(text.items).filter(([lang]) => lang !== defaultLanguage))

  return exportI8nTextToEnterprise(context, { items: filtredItems })
}
