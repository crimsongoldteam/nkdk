import { ConfigurationContext } from "~/metadata/context/types"
import { ToYAML } from "../rules"
import { getTypeRule } from "../types/factory"
import { ExportToYAMLFunction, ExportToYAMLFunctionNew, TypeRulesNames } from "../types/types"
import { MetadataItem, MetadataItemRule, PropertyRule } from "./types"

export function exportPropertiesToYAML<T extends MetadataItem>(params: {
  context: ConfigurationContext
  data: T | undefined
  rules: MetadataItemRule<T>
}): ToYAML<T> | undefined {
  const { context, data, rules } = params
  if (data === undefined) return undefined

  const result = {}

  let shortValue = undefined
  let canUseShortFormat: boolean = true

  for (const [key, rule] of Object.entries(rules.properties) as [Extract<keyof T, string>, PropertyRule][]) {
    const value = data[key]

    const exportedValues = exportPropertyToYAML({
      context,
      rule,
      value,
      name: "name" in data ? (data["name"] as string) : undefined,
    })

    if (exportedValues == undefined) continue

    Object.assign(result, exportedValues)

    if (rule.useAsShortValueYAML) {
      const keys = Object.keys(exportedValues)
      if (keys.length === 1 && typeof exportedValues[keys[0]] === "string") {
        shortValue = exportedValues[keys[0]]
      } else {
        canUseShortFormat = false
      }
    } else {
      canUseShortFormat = false
    }
  }

  if (canUseShortFormat) return shortValue

  return result as ToYAML<T>
}

export const exportPropertyToYAML = (params: {
  context: ConfigurationContext
  rule: PropertyRule
  value: any
  name?: string
}): Record<string, any> | undefined => {
  const { context, rule, value, name } = params

  if (!context.exportToYAML) throw new Error("context.exportToYAML is required")

  if (rule.yaml === undefined) return undefined

  if (!context.exportToYAML.toTyped && rule.toPartialYAML === false) return undefined

  const yamlKey = rule.yaml

  if (!yamlKey) {
    return undefined
  }

  const typeExportFn = getTypeRule(rule.type as TypeRulesNames, "exportToYAML")

  if (!typeExportFn) return getExportToYAMLResult(rule, yamlKey, value)

  if (typeExportFn.length === 1) {
    const exportedValue = (typeExportFn as ExportToYAMLFunctionNew)({
      context,
      rule,
      value,
      name: name,
    })

    return getExportToYAMLResult(rule, yamlKey, exportedValue)
  }

  const result = (typeExportFn as ExportToYAMLFunction)(context, rule, value)
  return getExportToYAMLResult(rule, yamlKey, result)
}

const getExportToYAMLResult = (rule: PropertyRule, yamlKey: string, value: any): Record<string, any> | undefined => {
  if (rule.type == "UserVisible" || rule.type == "FormattedI8nText") {
    return value
  }

  if (Array.isArray(value) && value.length === 0) return undefined

  if (value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === 0) return undefined

  return value === undefined ? undefined : { [yamlKey]: value }
}
