import { ConfigurationContext } from "~/metadata/context/types"
import { exportI8nTextToEnterprise } from "../i8nText/exportToEnterprise"
import { I8nTextEnterprise } from "../i8nText/types"
import { FormattedI8nText, FormattedI8nTextEnterprise } from "./types"

export const exportFormattedI8nTextToEnterprise = <Key extends string, FormattedKey extends string>(
  context: ConfigurationContext,
  title: FormattedI8nText | undefined,
  key: Key,
  formattedKey: FormattedKey
): { [K in Key | FormattedKey]?: FormattedI8nTextEnterprise } => {
  if (!title) return {}

  const exported = exportI8nTextToEnterprise(context, title)
  if (exported === undefined) return {}

  if (title.formatted) {
    return {
      [formattedKey]: exported,
    } as { [K in Key | FormattedKey]?: I8nTextEnterprise }
  }

  return {
    [key]: exported,
  } as { [K in Key | FormattedKey]?: I8nTextEnterprise }
}

export const exportFormattedI8nTextDefaultToEnterprise = (
  context: ConfigurationContext,
  title: FormattedI8nText | undefined
): FormattedI8nTextEnterprise | undefined => {
  return exportI8nTextToEnterprise(context, title)
}

export const exportFormattedI8nTextOtherToEnterprise = <Key extends string, FormattedKey extends string>(
  context: ConfigurationContext,
  text: FormattedI8nText | undefined,
  key: Key,
  formattedKey: FormattedKey
): { [K in Key | FormattedKey]?: FormattedI8nTextEnterprise } => {
  if (!text) return {}

  const defaultLanguage = context.defaultLanguage

  const filtredItems = Object.fromEntries(Object.entries(text.items).filter(([lang]) => lang !== defaultLanguage))

  const filtrdText: FormattedI8nText = { formatted: text.formatted, items: filtredItems }

  return exportFormattedI8nTextToEnterprise(context, filtrdText, key, formattedKey)
}
