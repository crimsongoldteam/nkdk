import { ConfigurationContext } from "~/metadata/context/types"
import { ToYAML } from "../rules"
import { getTypeRule, TypeRulesNames } from "../types/types"
import { MetadataItem, MetadataItemRule, PropertyRule } from "./types"

export function exportPropertiesToYAML<T extends MetadataItem>(params: {
  context: ConfigurationContext
  data: T | undefined
  rules: MetadataItemRule<T>
}): ToYAML<T> | undefined {
  const { context, data, rules } = params
  if (data === undefined) return undefined

  const result = {}

  for (const [key, rule] of Object.entries(rules.properties) as [keyof T, PropertyRule<T>][]) {
    const value = data[key]

    const exportedValues = exportPropertyToYAML({ context, rule, value })

    if (exportedValues == undefined) continue

    Object.assign(result, exportedValues)
  }

  return result as ToYAML<T>
}

export const exportPropertyToYAML = <T extends MetadataItem>(params: {
  context: ConfigurationContext
  rule: PropertyRule<T>
  value: any
}): Record<string, any> | undefined => {
  const { context, rule, value } = params

  if (!context.exportToYAML) throw new Error("context.exportToYAML is required")

  if (rule.yaml === undefined) return undefined

  if (!context.exportToYAML.toTyped && rule.toPartialYAML === false) return undefined

  // if (rule.type == "UserVisible") {
  //   const result = exportUserVisibleToYAML(context, rule, value as UserVisible)
  //   return result
  // }

  // if (rule.type == "FormattedI8nText") {
  //   const tempRule: FormattedI8nTextPropertyRule<T> = {
  //     ...rule,
  //     yamlPartialOthers: toTyped ? undefined : rule.yamlPartialOthers,
  //   }
  //   const result = exportFormattedI8nTextToYAML(context, tempRule, value)
  //   return result
  // }

  const yamlKey = rule.yaml

  if (!yamlKey) {
    return undefined
  }

  // if (rule.type == "I8nText") {
  //   const tempRule: I8nTextPropertyRule<T> = {
  //     ...rule,
  //     yamlPartialOthers: toTyped ? undefined : rule.yamlPartialOthers,
  //   }
  //   const result = exportI8nTextToYAML(context, tempRule, value)
  //   if (result === undefined) return undefined

  //   return { [yamlKey]: result }
  // }

  const typeExportFn = getTypeRule(rule.type as TypeRulesNames, "exportToEnterprise")

  if (!typeExportFn) return getExportToYAMLResult(rule, yamlKey, value)

  const result = typeExportFn(context, rule, value)
  return getExportToYAMLResult(rule, yamlKey, result)
}

const getExportToYAMLResult = (
  rule: PropertyRule<any>,
  yamlKey: string,
  value: any
): Record<string, any> | undefined => {
  if (rule.type == "UserVisible" || rule.type == "FormattedI8nText") {
    return value
  }
  return value ? { [yamlKey]: value } : undefined
}
