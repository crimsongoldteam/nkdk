import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule, registerTypeRule } from "~/metadata/metadataFactory"
import { exportI8nTextDefaultToYAML, exportI8nTextToYAML } from "../i8nText/toYAML"
import { I8nTextYAML } from "../i8nText/types"
import { FormattedI8nText, FormattedI8nTextPropertyRule, FormattedI8nTextYAML } from "./types"

export const exportFormattedI8nTextToYAML = <R extends FormattedI8nTextPropertyRule>(params: {
  context: ConfigurationContext
  rule: PropertyRule
  value: FormattedI8nText | undefined
  name?: string
}): { [K in NonNullable<R["yaml"] | R["yamlFormatted"]>]?: FormattedI8nTextYAML } => {
  const { context, rule, value: text } = params
  if (!text) return {}

  const formattedRule = rule as FormattedI8nTextPropertyRule

  const filtredText: FormattedI8nText = formattedRule.yamlPartialOthers
    ? {
        formatted: text.formatted,
        items: Object.fromEntries(Object.entries(text.items).filter(([lang]) => lang !== context.defaultLanguage)),
      }
    : text

  return exportToYAML(context, formattedRule, filtredText) as {
    [K in NonNullable<R["yaml"] | R["yamlFormatted"]>]?: FormattedI8nTextYAML
  }
}

const exportToYAML = <R extends FormattedI8nTextPropertyRule>(
  context: ConfigurationContext,
  rule: R,
  text: FormattedI8nText | undefined
): { [K in NonNullable<R["yaml"] | R["yamlFormatted"]>]?: FormattedI8nTextYAML } => {
  if (!text) return {}

  if (!rule.yaml) throw Error(`Rule must have yaml property`)

  const exported = exportI8nTextToYAML({ context, rule, value: text })
  if (exported === undefined) return {}

  if (text.formatted) {
    return {
      [rule.yamlFormatted]: exported,
    } as { [K in NonNullable<R["yaml"] | R["yamlFormatted"]>]?: FormattedI8nTextYAML }
  }

  return {
    [rule.yaml]: exported,
  } as { [K in NonNullable<R["yaml"] | R["yamlFormatted"]>]?: FormattedI8nTextYAML }
}

export const exportFormattedI8nTextDefaultToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule,
  title: FormattedI8nText | undefined
): FormattedI8nTextYAML | undefined => {
  return exportI8nTextDefaultToYAML(context, title)
}

/** @deprecated */
export const exportFormattedI8nTextToYAMLDeprecated = <Key extends string, FormattedKey extends string>(
  context: ConfigurationContext,
  _rule: PropertyRule,
  title: FormattedI8nText | undefined,
  key: Key,
  formattedKey: FormattedKey
): { [K in Key | FormattedKey]?: FormattedI8nTextYAML } => {
  if (!title) return {}

  const exported = exportI8nTextToYAML({ context, rule: { type: "I8nText" }, value: title })
  if (exported === undefined) return {}

  if (title.formatted) {
    return {
      [formattedKey]: exported,
    } as { [K in Key | FormattedKey]?: I8nTextYAML }
  }

  return {
    [key]: exported,
  } as { [K in Key | FormattedKey]?: I8nTextYAML }
}

/** @deprecated */
export const exportFormattedI8nTextOtherToYAML = <Key extends string, FormattedKey extends string>(
  context: ConfigurationContext,
  _rule: PropertyRule,
  text: FormattedI8nText | undefined,
  key: Key,
  formattedKey: FormattedKey
): { [K in Key | FormattedKey]?: FormattedI8nTextYAML } => {
  if (!text) return {}

  const defaultLanguage = context.defaultLanguage

  const filtredItems = Object.fromEntries(Object.entries(text.items).filter(([lang]) => lang !== defaultLanguage))

  const filtrdText: FormattedI8nText = { formatted: text.formatted, items: filtredItems }

  return exportFormattedI8nTextToYAMLDeprecated(context, { type: "I8nText" }, filtrdText, key, formattedKey)
}

registerTypeRule("FormattedI8nText", "exportToYAML", exportFormattedI8nTextToYAML as any)
