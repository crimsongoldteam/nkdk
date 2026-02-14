import { exportFormattedI8nTextToYAML } from "~/metadata/commonObjects/formattedI8nText/exportToEnterprise"
import { exportI8nTextToYAML } from "~/metadata/commonObjects/i8nText/toYAML"
import { exportUserVisibleToYAML } from "~/metadata/commonObjects/userVisible/exportToEnterprise"
import { UserVisible } from "~/metadata/commonObjects/userVisible/types"
import { ConfigurationContext } from "~/metadata/context/types"
import { getTypeRule, TypeRulesNames } from "../typeRulesFactory"
import { ToPartialEnterpriseType } from "../types"
import {
  FormattedI8nTextPropertyRule,
  I8nTextPropertyRule,
  MetadataItem,
  MetadataItemRule,
  PropertyRule,
} from "./types"

export function exportPropertiesToYAML<T extends MetadataItem>(params: {
  context: ConfigurationContext
  data: T | undefined
  rules: MetadataItemRule<T>
}): ToPartialEnterpriseType<T> | undefined {
  const { context, data, rules } = params
  if (data === undefined) return undefined

  const result = {}

  for (const [key, rule] of Object.entries(rules.properties) as [keyof T, PropertyRule<T>][]) {
    const value = data[key]

    const exportedValues = exportPropertyToYAML({ context, rule, value })

    if (exportedValues == undefined) continue

    Object.assign(result, exportedValues)
  }

  return result as ToPartialEnterpriseType<T>
}

export const exportPropertyToYAML = <T extends MetadataItem>(params: {
  context: ConfigurationContext
  rule: PropertyRule<T>
  value: any
  toTyped?: true
}): Record<string, any> | undefined => {
  const { context, rule, value, toTyped } = params

  if (rule.yaml === undefined) return undefined

  if (!toTyped && rule.toPartialYAML === false) return undefined

  if (rule.type == "UserVisible") {
    const result = exportUserVisibleToYAML(context, rule, value as UserVisible)
    return result
  }

  if (rule.type == "FormattedI8nText") {
    const tempRule: FormattedI8nTextPropertyRule<T> = {
      ...rule,
      yamlPartialOthers: toTyped ? undefined : rule.yamlPartialOthers,
    }
    const result = exportFormattedI8nTextToYAML(context, tempRule, value)
    return result
  }

  const yamlKey = rule.yaml

  if (rule.type == "I8nText") {
    const tempRule: I8nTextPropertyRule<T> = {
      ...rule,
      yamlPartialOthers: toTyped ? undefined : rule.yamlPartialOthers,
    }
    const result = exportI8nTextToYAML(context, tempRule, value)
    if (result === undefined) return undefined

    return { [yamlKey]: result }
  }

  const typeExportFn = getTypeRule(rule.type as TypeRulesNames, "exportToEnterprise")

  if (!yamlKey) {
    return undefined
  }

  if (!typeExportFn) {
    if (value === undefined) return undefined
    return { [yamlKey]: value }
  }

  const result = typeExportFn(context, rule, value)
  return result ? { [yamlKey]: result } : undefined
}
