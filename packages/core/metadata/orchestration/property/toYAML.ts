import { ConfigurationContext } from "../../context/types"
import { buildExternalFileEntry } from "../../forms/commonObjects/dynamicList/externalFile"
import { ToMetadata, ToYAML } from ".."
import { getTypeRule } from "./typeRuleRegistry"
import { ExportToYAMLFunction, ExportToYAMLFunctionNew } from "./fn"
import { shouldProcessProperty } from "./helpers"
import { exportStringMetadataTargetToYAML, metadataTargetOwnerFromRule } from "./metadataTargetString"
import type { MetadataItemRule, PropertyRule } from "./types"
import type { MetadataTargetOwner } from "../../commonObjects/metadataTargets/types"

export function exportPropertiesToYAML<Rule extends MetadataItemRule>(params: {
  context: ConfigurationContext
  data: ToMetadata<Rule["itemType"]> | undefined
  rule: Rule
  name?: string
}): ToYAML<Rule["itemType"]> | undefined {
  const { context, data, rule: rule } = params
  if (data === undefined) return undefined

  const result = {}
  const name = params.name ?? ("name" in data ? (data["name"] as string) : undefined)
  const owner = metadataTargetOwnerFromRule({
    itemRule: rule,
    name,
    context,
  })
  const itemContext = contextWithMetadataTargetOwner(context, rule.itemType, name, owner)

  for (const [key, propertyRule] of Object.entries(rule.properties)) {
    // Свойство с externalFile: значение идёт во внешний файл, не в YAML
    if ("externalFile" in propertyRule && propertyRule.externalFile && propertyRule.toYAML !== false) {
      const value = data[key as keyof ToMetadata<Rule["itemType"]>]
      const collector = itemContext.exportToYAML?.externalFilesCollector
      const parentName = itemContext.exportToYAML?.parent?.name
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
      context: itemContext,
      rule: propertyRule,
      value,
      name,
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
  const exportedValue = exportPropertyValueToYAML(params)
  return getExportToYAMLResult(params.rule, params.rule.yaml!, exportedValue, params.value)
}

export function exportPropertyValueToYAML(params: {
  context: ConfigurationContext
  rule: PropertyRule
  value: unknown
  name?: string
  owner?: MetadataTargetOwner
}): unknown {
  const { context, rule, value, name } = params

  if (!canExportPropertyToYAML({ context, rule })) return undefined

  if ("implicitValueYAML" in rule && value === (rule as any).implicitValueYAML) return undefined

  const typeExportFn = getTypeRule(rule.type, "exportToYAML")

  if (!typeExportFn) {
    const exportedValue =
      rule.type === "string" ? exportStringMetadataTargetToYAML({ rule, value, owner: params.owner }) : value
    return exportedValue
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
      rule.type === "string"
        ? exportStringMetadataTargetToYAML({ rule, value: typedValue, owner: params.owner })
        : typedValue

    return exportedValue
  }

  const typedResult = (typeExportFn as ExportToYAMLFunction)(nestedContext, rule, value)
  return rule.type === "string"
    ? exportStringMetadataTargetToYAML({ rule, value: typedResult, owner: params.owner })
    : typedResult
}

export function canExportPropertyToYAML(params: {
  context: ConfigurationContext
  rule: PropertyRule
}): boolean {
  const { context, rule } = params

  if (!context.exportToYAML) throw new Error("context.exportToYAML is required")

  if (rule.yaml === undefined) return false

  if (rule.toYAML === false) return false

  if (!context.exportToYAML.toTyped && rule.toPartialYAML === false) return false

  if (!rule.yaml) return false
  return true
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

function contextWithMetadataTargetOwner(
  context: ConfigurationContext,
  itemType: MetadataItemRule["itemType"],
  name: string | undefined,
  owner: MetadataTargetOwner | undefined
): ConfigurationContext {
  if (!name) return context

  return {
    ...context,
    exportToYAML: context.exportToYAML
      ? {
          ...context.exportToYAML,
          metadataTargetOwners: [
            ...(context.exportToYAML.metadataTargetOwners ?? []),
            { itemType, name, ...(owner ? { owner } : {}) },
          ],
        }
      : context.exportToYAML,
  }
}

export const getExportToYAMLResult = (
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
