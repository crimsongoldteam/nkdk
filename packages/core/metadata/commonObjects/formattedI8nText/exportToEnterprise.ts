import { ConfigurationContext } from "~/metadata/context/types"
import { exportI8nTextDefaultToEnterprise, exportI8nTextToEnterprise } from "../i8nText/exportToEnterprise"
import { I8nTextEnterprise } from "../i8nText/types"
import { FormattedI8nText, FormattedI8nTextEnterprise } from "./types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory/typeRulesFactory"

export const exportFormattedI8nTextToEnterprise = <Key extends string, FormattedKey extends string>(
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  title: FormattedI8nText | undefined,
  key: Key,
  formattedKey: FormattedKey
): { [K in Key | FormattedKey]?: FormattedI8nTextEnterprise } => {
  if (!title) return {}

  const exported = exportI8nTextToEnterprise(context, undefined, title)
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
  _rule: PropertyRule | undefined,
  title: FormattedI8nText | undefined
): FormattedI8nTextEnterprise | undefined => {
  return exportI8nTextDefaultToEnterprise(context, undefined, title)
}

export const exportFormattedI8nTextOtherToEnterprise = <Key extends string, FormattedKey extends string>(
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  text: FormattedI8nText | undefined,
  key: Key,
  formattedKey: FormattedKey
): { [K in Key | FormattedKey]?: FormattedI8nTextEnterprise } => {
  if (!text) return {}

  const defaultLanguage = context.defaultLanguage

  const filtredItems = Object.fromEntries(Object.entries(text.items).filter(([lang]) => lang !== defaultLanguage))

  const filtrdText: FormattedI8nText = { formatted: text.formatted, items: filtredItems }

  return exportFormattedI8nTextToEnterprise(context, undefined, filtrdText, key, formattedKey)
}


registerTypeRule("FormattedI8nText", "exportToEnterprise", exportToEnterprise)