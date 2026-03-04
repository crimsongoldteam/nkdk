import { ConfigurationContext } from "~/metadata/context/types"
import { MetadataItemTypeToMdItem, MetadataItemTypeToYAML } from ".."
import { getTypeRule } from "../formElement/factory"
import { ExportToYAMLFunction, ExportToYAMLFunctionNew } from "./fn"
import { MetadataItemRule, PropertyRule } from "./types"

export function exportPropertiesToYAML<Rule extends MetadataItemRule>(params: {
  context: ConfigurationContext
  data: MetadataItemTypeToMdItem<Rule["itemType"]> | undefined
  rule: Rule
}): MetadataItemTypeToYAML<Rule["itemType"]> | undefined {
  const { context, data, rule: rule } = params
  if (data === undefined) return undefined

  const result = {}

  let shortValue = undefined
  let canUseShortFormat: boolean = true

  for (const [key, propertyRule] of Object.entries(rule.properties)) {
    const value = data[key as keyof MetadataItemTypeToMdItem<Rule["itemType"]>]

    const exportedValues = exportPropertyToYAML({
      context,
      rule: propertyRule,
      value,
      name: "name" in data ? (data["name"] as string) : undefined,
    })

    if (exportedValues == undefined) continue

    Object.assign(result, exportedValues)

    if (propertyRule.useAsShortValueYAML) {
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

  return result
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

  const typeExportFn = getTypeRule(rule.type, "exportToYAML")

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
