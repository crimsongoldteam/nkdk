import { ConfigurationContext } from "~/metadata/context/types"
import { FormattedI8nTextPropertyRule, PropertyRule, registerTypeRule } from "~/metadata/metadataFactory"
import { exportI8nTextDefaultToEnterprise, exportI8nTextToYAML } from "../i8nText/toYAML"
import { I8nTextEnterprise } from "../i8nText/types"
import { FormattedI8nText, FormattedI8nTextEnterprise } from "./types"

export const exportFormattedI8nTextToYAML = <R extends FormattedI8nTextPropertyRule<any>>(params: {
  context: ConfigurationContext
  rule: PropertyRule<any>
  value: FormattedI8nText | undefined
  name?: string
}): { [K in NonNullable<R["yaml"] | R["yamlFormatted"]>]?: FormattedI8nTextEnterprise } => {
  const { context, rule, value: text } = params
  if (!text) return {}

  const formattedRule = rule as FormattedI8nTextPropertyRule<any>

  const filtredText: FormattedI8nText = formattedRule.yamlPartialOthers
    ? {
        formatted: text.formatted,
        items: Object.fromEntries(Object.entries(text.items).filter(([lang]) => lang !== context.defaultLanguage)),
      }
    : text

  return exportToYAML(context, formattedRule, filtredText) as {
    [K in NonNullable<R["yaml"] | R["yamlFormatted"]>]?: FormattedI8nTextEnterprise
  }
}

const exportToYAML = <R extends FormattedI8nTextPropertyRule<any>>(
  context: ConfigurationContext,
  rule: R,
  text: FormattedI8nText | undefined
): { [K in NonNullable<R["yaml"] | R["yamlFormatted"]>]?: FormattedI8nTextEnterprise } => {
  if (!text) return {}

  if (!rule.yaml) throw Error(`Rule must have yaml property`)

  const exported = exportI8nTextToYAML({ context, rule, value: text })
  if (exported === undefined) return {}

  if (text.formatted) {
    return {
      [rule.yamlFormatted]: exported,
    } as { [K in NonNullable<R["yaml"] | R["yamlFormatted"]>]?: FormattedI8nTextEnterprise }
  }

  return {
    [rule.yaml]: exported,
  } as { [K in NonNullable<R["yaml"] | R["yamlFormatted"]>]?: FormattedI8nTextEnterprise }
}

export const exportFormattedI8nTextDefaultToEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  title: FormattedI8nText | undefined
): FormattedI8nTextEnterprise | undefined => {
  return exportI8nTextDefaultToEnterprise(context, title)
}

/** @deprecated */
export const exportFormattedI8nTextToEnterprise = <Key extends string, FormattedKey extends string>(
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  title: FormattedI8nText | undefined,
  key: Key,
  formattedKey: FormattedKey
): { [K in Key | FormattedKey]?: FormattedI8nTextEnterprise } => {
  if (!title) return {}

  const exported = exportI8nTextToYAML({ context, rule: { type: "I8nText" }, value: title })
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

/** @deprecated */
export const exportFormattedI8nTextOtherToEnterprise = <Key extends string, FormattedKey extends string>(
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  text: FormattedI8nText | undefined,
  key: Key,
  formattedKey: FormattedKey
): { [K in Key | FormattedKey]?: FormattedI8nTextEnterprise } => {
  if (!text) return {}

  const defaultLanguage = context.defaultLanguage

  const filtredItems = Object.fromEntries(Object.entries(text.items).filter(([lang]) => lang !== defaultLanguage))

  const filtrdText: FormattedI8nText = { formatted: text.formatted, items: filtredItems }

  return exportFormattedI8nTextToEnterprise(context, { type: "I8nText" }, filtrdText, key, formattedKey)
}

registerTypeRule("FormattedI8nText", "exportToEnterprise", exportFormattedI8nTextToYAML as any)
