import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { exportI8nTextDefaultToYAML, exportI8nTextToYAML } from "../i8nText/exportToYAML"
import { I8nTextEnterprise } from "../i8nText/types"
import { FormattedI8nText, FormattedI8nTextEnterprise } from "./types"

export const exportFormattedI8nTextToYAML = <Key extends string, FormattedKey extends string>(
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  title: FormattedI8nText | undefined,
  key: Key,
  formattedKey: FormattedKey
): { [K in Key | FormattedKey]?: FormattedI8nTextEnterprise } => {
  if (!title) return {}

  const exported = exportI8nTextToYAML(context, undefined, _rule, title)
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

export const exportFormattedI8nTextDefaultToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  title: FormattedI8nText | undefined
): FormattedI8nTextEnterprise | undefined => {
  return exportI8nTextDefaultToYAML(context, undefined, _rule, title)
}

export const exportFormattedI8nTextOtherToYAML = <Key extends string, FormattedKey extends string>(
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

  return exportFormattedI8nTextToYAML(context, undefined, _rule, filtrdText, key, formattedKey)
}
