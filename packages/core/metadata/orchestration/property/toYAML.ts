import { ConfigurationContext } from "~/metadata/context/types"
import { buildExternalFileEntry } from "~/metadata/forms/commonObjects/dynamicList/externalFile"
import { ToMetadata, ToYAML } from ".."
import { getTypeRule } from "../formElement/factory"
import { ExportToYAMLFunction, ExportToYAMLFunctionNew } from "./fn"
import { shouldProcessProperty } from "./helpers"
import { MetadataItemRule, PropertyRule } from "./types"

export function exportPropertiesToYAML<Rule extends MetadataItemRule>(params: {
  context: ConfigurationContext
  data: ToMetadata<Rule["itemType"]> | undefined
  rule: Rule
}): ToYAML<Rule["itemType"]> | undefined {
  const { context, data, rule: rule } = params
  if (data === undefined) return undefined

  const result = {}

  let shortValue = undefined
  let canUseShortFormat: boolean = true

  for (const [key, propertyRule] of Object.entries(rule.properties)) {
    // Свойство с externalFile: значение идёт во внешний файл, не в YAML
    if ("externalFile" in propertyRule && propertyRule.externalFile && propertyRule.toYAML !== false) {
      const value = data[key as keyof ToMetadata<Rule["itemType"]>]
      const collector = context.exportToYAML?.externalFilesCollector
      const parentName = context.exportToYAML?.parent?.name
      if (collector !== undefined && parentName !== undefined && value !== undefined) {
        const entry = buildExternalFileEntry(propertyRule.externalFile, parentName, value as string)
        if (entry !== null) collector.push(entry)
      }
      continue
    }

    if (!shouldProcessProperty({ rule: propertyRule, operation: "exportToYAML" })) continue
    const value = data[key as keyof ToMetadata<Rule["itemType"]>]

    if (propertyRule.derivedFrom?.externalFile) {
      if (value === true) continue

      const referencedKey = propertyRule.derivedFrom.externalFile as keyof ToMetadata<Rule["itemType"]>
      const referencedValue = data[referencedKey]
      if (value === propertyRule.defaultValueYAML && referencedValue === undefined) continue
    }

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

  if (rule.toYAML === false) return undefined

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

    return getExportToYAMLResult(rule, yamlKey, exportedValue, value)
  }

  const result = (typeExportFn as ExportToYAMLFunction)(context, rule, value)
  return getExportToYAMLResult(rule, yamlKey, result, value)
}

const getExportToYAMLResult = (
  rule: PropertyRule,
  yamlKey: string,
  value: any,
  sourceValue?: any
): Record<string, any> | undefined => {
  if (rule.type == "UserVisible" || rule.type == "FormattedI8nText") {
    return value
  }

  if ("defaultValueYAML" in rule && sourceValue === (rule as any).defaultValueYAML) return undefined
  if ("defaultValueYAML" in rule && value === (rule as any).defaultValueYAML) return undefined

  if (Array.isArray(value) && value.length === 0) return undefined

  if (value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === 0) return undefined

  return value === undefined ? undefined : { [yamlKey]: value }
}
