import { ConfigurationContext } from "../../context/types"
import { getTypeRule } from "./typeRuleRegistry"
import { ExportToYAMLFunction, ExportToYAMLFunctionNew } from "./fn"
import { exportStringMetadataTargetToYAML } from "./metadataTargetString"
import type { PropertyRule } from "./types"
import type { MetadataTargetOwner } from "../../commonObjects/metadataTargets/types"

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

export function canExportPropertyToYAML(params: { context: ConfigurationContext; rule: PropertyRule }): boolean {
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
