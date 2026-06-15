import { ConfigurationContext } from "~/metadata/context/types"
import { buildExternalFileEntry } from "~/metadata/forms/commonObjects/dynamicList/externalFile"
import { ToMetadata, ToYAML } from ".."
import { getTypeRule } from "./typeRuleRegistry"
import { ExportToYAMLFunction, ExportToYAMLFunctionNew } from "./fn"
import { shouldProcessProperty } from "./helpers"
import { exportStringMetadataTargetToYAML, metadataTargetOwnerFromRule } from "./metadataTargetString"
import { MetadataItemRule, PropertyRule } from "./types"
import type { MetadataTargetOwner } from "~/metadata/commonObjects/metadataTargets/types"

export function exportPropertiesToYAML<Rule extends MetadataItemRule>(params: {
  context: ConfigurationContext
  data: ToMetadata<Rule["itemType"]> | undefined
  rule: Rule
}): ToYAML<Rule["itemType"]> | undefined {
  const { context, data, rule: rule } = params
  if (data === undefined) return undefined

  const result = {}
  const owner = metadataTargetOwnerFromRule({
    itemRule: rule,
    name: "name" in data ? (data["name"] as string) : undefined,
    context,
  })

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
      if (value === propertyRule.implicitValueYAML && referencedValue === undefined) continue
    }

    const exportedValues = exportPropertyToYAML({
      context,
      rule: propertyRule,
      value,
      name: "name" in data ? (data["name"] as string) : undefined,
      owner,
    })

    if (exportedValues == undefined) continue

    Object.assign(result, exportedValues)
  }

  return result
}

export const exportPropertyToYAML = (params: {
  context: ConfigurationContext
  rule: PropertyRule
  value: any
  name?: string
  owner?: MetadataTargetOwner
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

  if ("implicitValueYAML" in rule && value === (rule as any).implicitValueYAML) return undefined

  const typeExportFn = getTypeRule(rule.type, "exportToYAML")

  if (!typeExportFn) {
    const exportedValue =
      rule.type === "string" ? exportStringMetadataTargetToYAML({ rule, value, owner: params.owner }) : value
    return getExportToYAMLResult(rule, yamlKey, exportedValue, value)
  }

  const nestedContext = contextWithPropertyParentName(context, name)

  if (typeExportFn.length === 1) {
    const typedValue = (typeExportFn as ExportToYAMLFunctionNew)({
      context: nestedContext,
      rule,
      value,
      name: name,
      owner: params.owner,
    })
    const exportedValue =
      rule.type === "string" ? exportStringMetadataTargetToYAML({ rule, value: typedValue, owner: params.owner }) : typedValue

    return getExportToYAMLResult(rule, yamlKey, exportedValue, value)
  }

  const typedResult = (typeExportFn as ExportToYAMLFunction)(nestedContext, rule, value)
  const result =
    rule.type === "string" ? exportStringMetadataTargetToYAML({ rule, value: typedResult, owner: params.owner }) : typedResult
  return getExportToYAMLResult(rule, yamlKey, result, value)
}

function contextWithPropertyParentName(context: ConfigurationContext, name: string | undefined): ConfigurationContext {
  if (!name) return context

  return {
    ...context,
    exportToYAML: context.exportToYAML
      ? {
          ...context.exportToYAML,
          parent: context.exportToYAML.parent ?? { name },
        }
      : context.exportToYAML,
  }
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

  if (
    rule.omitImplicitValueYAMLBySource === true &&
    "implicitValueYAML" in rule &&
    sourceValue === (rule as any).implicitValueYAML
  ) {
    return undefined
  }
  if ("implicitValueYAML" in rule && value === (rule as any).implicitValueYAML) return undefined

  if (Array.isArray(value) && value.length === 0) return undefined

  if (value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === 0) return undefined

  return value === undefined ? undefined : { [yamlKey]: value }
}
