import { ConfigurationContext } from "../../context/types"
import { getTypeRule } from "./typeRuleRegistry"
import {
  ExportToYAMLFunction,
  ExportToYAMLFunctionNew,
  type PropertyRuleExecution,
} from "./fn"
import {
  cloneMetadataTargetValue,
  projectMetadataTargetOccurrencesToYAML,
  type MetadataTargetYAMLProjection,
} from "./metadataTargetOccurrences"
import type { PropertyRule } from "./types"
import type { MetadataTargetOwner } from "../metadataTarget/types"
import { isTaggedYAMLScalar, markYAMLScalarTag } from "../../../yaml/scalarTags"
import type { CompiledProperty } from "./compiledPropertyPlan"
import { resolveAtomicConversion } from "./atomicConversion"

export const exportPropertyToYAML = (params: {
  context: ConfigurationContext
  rule: PropertyRule
  value: any
  name?: string
  owner?: MetadataTargetOwner
  execution?: PropertyRuleExecution
  compiled?: CompiledProperty
}): Record<string, any> | undefined => {
  const exportedValue = exportPropertyValueToYAML(params)
  return getExportToYAMLResult(
    params.rule,
    params.rule.yaml!,
    exportedValue,
    params.value,
    params.execution,
    params.compiled,
  )
}

export function exportPropertyValueToYAML(params: {
  context: ConfigurationContext
  rule: PropertyRule
  value: unknown
  name?: string
  owner?: MetadataTargetOwner
  execution?: PropertyRuleExecution
  compiled?: CompiledProperty
  preserveImplicitValue?: boolean
}): unknown {
  return exportPropertyMetadataTargetsToYAML(
    params,
    exportPropertyValueBeforeMetadataTargetsToYAML(params),
  )
}

export function exportPropertyValueBeforeMetadataTargetsToYAML(params: {
  context: ConfigurationContext
  rule: PropertyRule
  value: unknown
  name?: string
  owner?: MetadataTargetOwner
  execution?: PropertyRuleExecution
  compiled?: CompiledProperty
  preserveImplicitValue?: boolean
}): unknown {
  const { context, rule, value, name } = params

  if (!canExportPropertyToYAML({ context, rule })) return undefined

  if (
    params.preserveImplicitValue !== true &&
    "implicitValueYAML" in rule && value === (rule as any).implicitValueYAML
  ) return undefined

  const atomicConversion = resolveAtomicConversion({
    rule,
    execution: params.execution,
    compiled: params.compiled,
    getTypeRule,
  })
  if (atomicConversion !== undefined) {
    return atomicConversion.fromXMLToYAML({ context, value }).representationValue
  }

  const typeExportFn = params.compiled === undefined
    ? params.execution === undefined
      ? getTypeRule(rule.type, "exportToYAML")
      : params.execution.getTypeRule(rule.type, "exportToYAML")
    : params.compiled.operations.exportToYAML

  if (!typeExportFn) return value

  const nestedContext = contextWithPropertyParentName(context, name)

  if (typeExportFn.length === 1) {
    const typedValue = (typeExportFn as ExportToYAMLFunctionNew)({
      context: nestedContext,
      rule,
      value,
      name: name,
      owner: params.owner,
    })
    return typedValue
  }

  const typedResult = (typeExportFn as ExportToYAMLFunction)(nestedContext, rule, value)
  return typedResult
}

export function exportPropertyMetadataTargetsToYAML(
  params: Parameters<typeof exportPropertyValueToYAML>[0],
  value: unknown,
): unknown {
  return projectPropertyMetadataTargetsToYAML(params, value).value
}

export function projectPropertyMetadataTargetsToYAML(
  params: Parameters<typeof exportPropertyValueToYAML>[0],
  value: unknown,
): MetadataTargetYAMLProjection {
  const handler = params.compiled === undefined
    ? params.execution === undefined
      ? getTypeRule(params.rule.type, "metadataTargetOccurrences")
      : params.execution.getTypeRule(params.rule.type, "metadataTargetOccurrences")
    : params.compiled.operations.metadataTargetOccurrences
  if (handler === undefined) {
    return { value, uuidOccurrences: [] }
  }
  const prepared = cloneMetadataTargetValue(value)
  const occurrences = handler({
    value: prepared,
    representation: "yaml",
    yamlPath: typeof params.rule.yaml === "string" ? [params.rule.yaml] : [],
    propRule: params.rule,
    owner: params.owner,
  })
  return projectMetadataTargetOccurrencesToYAML({ value: prepared, occurrences, owner: params.owner })
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
  sourceValue?: any,
  execution?: PropertyRuleExecution,
  compiled?: CompiledProperty,
): Record<string, any> | undefined => {
  if (rule.type == "UserVisible" || rule.type == "FormattedI8nText") {
    return value
  }

  if (
    rule.preserveExplicitDefaultXML !== true &&
    rule.omitImplicitValueYAMLBySource === true &&
    "implicitValueYAML" in rule &&
    sourceValue === (rule as any).implicitValueYAML
  ) {
    return undefined
  }
  if (
    rule.preserveExplicitDefaultXML !== true &&
    "implicitValueYAML" in rule &&
    value === (rule as any).implicitValueYAML
  ) return undefined

  const preservesPresence = (compiled === undefined
    ? execution === undefined
      ? getTypeRule(rule.type, "xmlImportPropertyBehavior")
      : execution.getTypeRule(rule.type, "xmlImportPropertyBehavior")
    : compiled.operations.xmlImportPropertyBehavior)
    ?.presenceAffectsExport === true
  if (
    Array.isArray(value) &&
    value.length === 0 &&
    !preservesPresence &&
    !(
      rule.yamlInline === true &&
      Array.isArray(rule.defaultValue) &&
      rule.defaultValue.length === 0 &&
      Array.isArray(rule.defaultValueXMLEmpty)
    )
  )
    return undefined

  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.keys(value).length === 0 &&
    !preservesPresence
  )
    return undefined

  if (value === undefined) return undefined
  if (isTaggedYAMLScalar(value)) {
    const result = { [yamlKey]: value.value }
    markYAMLScalarTag(result, yamlKey, value.tag)
    return result
  }
  return { [yamlKey]: value }
}
