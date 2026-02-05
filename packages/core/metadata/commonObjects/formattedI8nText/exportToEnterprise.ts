import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { FormattedI8nTextPropertyRule } from "~/metadata/metadataFactory"
import { registerTypeRule } from "~/metadata/metadataFactory/typeRulesFactory"
import { exportI8nTextDefaultToEnterprise, exportI8nTextToEnterprise } from "../i8nText/exportToEnterprise"
import { I8nTextEnterprise } from "../i8nText/types"
import { FormattedI8nText, FormattedI8nTextEnterprise } from "./types"

/** @deprecated */
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

export const exportFormattedI8nTextToYAML = <R extends FormattedI8nTextPropertyRule>(
  context: ConfigurationContext,
  rule: R,
  text: FormattedI8nText | undefined
): { [K in R["yaml"] | R["yamlFormatted"]]?: FormattedI8nTextEnterprise } => {
  if (!text) return {}

  const exported = exportI8nTextToEnterprise(context, undefined, text)
  if (exported === undefined) return {}

  if (text.formatted) {
    return {
      [rule.yamlFormatted]: exported,
    } as { [K in R["yaml"] | R["yamlFormatted"]]?: FormattedI8nTextEnterprise }
  }

  return {
    [rule.yaml]: exported,
  } as { [K in R["yaml"] | R["yamlFormatted"]]?: FormattedI8nTextEnterprise }
}

/** @deprecated */
export const exportFormattedI8nTextDefaultToEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  title: FormattedI8nText | undefined
): FormattedI8nTextEnterprise | undefined => {
  return exportI8nTextDefaultToEnterprise(context, undefined, title)
}

/** @deprecated */
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

export const exportFormattedI8nTextOtherToYAML = <R extends FormattedI8nTextPropertyRule>(
  context: ConfigurationContext,
  rule: R,
  text: FormattedI8nText | undefined
): { [K in R["yaml"] | R["yamlFormatted"]]?: FormattedI8nTextEnterprise } => {
  if (!text) return {}

  const defaultLanguage = context.defaultLanguage

  const filtredItems = Object.fromEntries(Object.entries(text.items).filter(([lang]) => lang !== defaultLanguage))

  const filtredText: FormattedI8nText = { formatted: text.formatted, items: filtredItems }

  return exportFormattedI8nTextToYAML(context, rule, filtredText)
}

registerTypeRule("FormattedI8nText", "exportToEnterprise", exportFormattedI8nTextToYAML as any)
