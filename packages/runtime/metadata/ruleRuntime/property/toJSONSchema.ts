import { TProperties, TSchema, Type } from "typebox"
import { ConfigurationContext } from "../../context/types"
import { applyExcludedEqualNameYAMLToJSONSchema } from "../../helpers/excludeIfEqualNameYAML"
import { getTypeRule } from "./typeRuleRegistry"
import type { PropertyRuleExecution } from "./fn"
import {
  exportPropertyExternalRefSchema,
  exportPropertyOverrideSchema,
  exportValidationPropertyRefSchema,
} from "../jsonSchemaRefs"
import { shouldProcessProperty } from "./helpers"
import type { MetadataItem, MetadataItemRule, PropertyRule } from "./types"
import { getSystemEnumeration } from "./systemEnumerationRegistry"
import { EMPTY_XML_TAG_VALUE } from "../../../yaml/scalarTags"
import { explicitXMLPropertyValidationMode } from "./explicitXMLPropertyRegistry"

function notSchema(schema: TSchema): TSchema {
  return { not: schema } as TSchema
}

function withPropertyDescription(schema: TSchema, description: string | undefined): TSchema {
  if (description === undefined) return schema
  const rawDescription = (schema as { description?: unknown }).description
  const current = typeof rawDescription === "string" ? rawDescription : undefined
  return {
    ...schema,
    description: current === undefined ? description : `${current}\n\n${description}`,
  } as TSchema
}

function withExplicitXMLValidationValue(params: {
  context: ConfigurationContext
  itemType: string
  propertyKey: string
  rule: PropertyRule
  schema: TSchema
  execution?: PropertyRuleExecution
}): TSchema {
  if (
    params.context.exportToJSONSchema?.explicitXMLValues !== true
    && params.context.exportToJSONSchema?.validationPropertyRefs !== true
  ) return params.schema
  let schema = params.schema
  if (
    (params.context.exportToJSONSchema?.explicitXMLValues === true ||
      params.context.exportToJSONSchema?.validationPropertyRefs === true) &&
    params.rule.metadataTarget !== undefined &&
    (params.rule.type === "string" || params.rule.type === "MetadataItemLink" || params.rule.type === "MetadataField")
  ) {
    schema = Type.Union([schema, Type.Null()])
  }
  if (
    params.rule.type === "DataPath" &&
    params.rule.yaml === "ПутьКДанным" &&
    params.rule.allowedKinds !== undefined
  ) {
    schema = Type.Union([schema, Type.String({ pattern: "^!xml[ \\t]+\\S.*$" })])
  }
  const mode = params.execution === undefined
    ? explicitXMLPropertyValidationMode(params.itemType, params.propertyKey, params.rule.type)
    : params.execution.explicitXMLPropertyValidationMode(
        params.itemType,
        params.propertyKey,
        params.rule.type,
      )
  if (mode === "empty") {
    schema = shouldProcessProperty({ rule: params.rule, operation: "importFromYAML" })
      ? Type.Union([schema, Type.Literal(EMPTY_XML_TAG_VALUE)])
      : Type.Literal(EMPTY_XML_TAG_VALUE)
  }
  if (mode === "scalar") schema = Type.Union([schema, Type.String({ pattern: "^!xml(?: .*)?$" })])
  return params.execution?.brokenXMLReferenceValidationSchema({
    rule: params.rule,
    base: schema,
    validationGraph:
      params.context.exportToJSONSchema?.validationPropertyRefs === true,
  }) ?? schema
}

/**
 * Возвращает YAML-представление implicitValueYAML.
 * Только для литеральных значений: функции зависят от контекста объекта.
 */
export function getImplicitValueYAML(
  rule: PropertyRule,
  execution?: PropertyRuleExecution,
): string | number | undefined {
  const v = rule.implicitValueYAML
  if (v === undefined || typeof v === "function") return undefined
  if (rule.type === "boolean" && typeof v === "boolean") return v ? "Истина" : "Ложь"
  if (rule.type === "number" && typeof v === "number") return v
  if ((rule.type === "string" || rule.type === "I8nText") && typeof v === "string") return v
  if (rule.type === "SystemEnumeration" && typeof v === "string") {
    const typeSE = (rule as { typeSE?: string }).typeSE
    if (typeSE === undefined) return v
    return (execution?.getSystemEnumeration(typeSE) ?? getSystemEnumeration(typeSE))
      ?.toYAML[v] ?? v
  }
  return undefined
}

/**
 * Исключает неявное YAML-значение из схемы.
 * Для anyOf/const удаляет конкретный вариант, для свободных схем добавляет not/const.
 */
function excludeImplicitValueFromSchema(schema: TSchema, implicitYAML: string | number): TSchema {
  const s = schema as { anyOf?: TSchema[] }
  if (Array.isArray(s.anyOf)) {
    const rest = s.anyOf.filter((opt) => (opt as { const?: unknown }).const !== implicitYAML)
    if (rest.length === 0) return Type.Never()
    if (rest.length < s.anyOf.length) {
      if (rest.length === 1) return rest[0]
      return Type.Union(rest as [TSchema, TSchema, ...TSchema[]])
    }
  }

  return Type.Intersect([schema, notSchema(Type.Literal(implicitYAML))])
}

export const exportPropertiesToJSONSchema = <T extends MetadataItem>(params: {
  context: ConfigurationContext
  rule: MetadataItemRule
  metadataItem?: T
  execution?: PropertyRuleExecution
}): TProperties => {
  const { context, metadataItem, rule } = params

  const result: TProperties = {}

  for (const [key, ruleProp] of Object.entries(rule.properties) as [
    keyof T extends string ? keyof T : never,
    PropertyRule,
  ][]) {
    // if (ruleProp.fromEnterprise === false) continue
    const importsFromYAML = shouldProcessProperty({ rule: ruleProp, operation: "importFromYAML" })
    const validatesExplicitXML =
      (params.context.exportToJSONSchema?.explicitXMLValues === true ||
        params.context.exportToJSONSchema?.validationPropertyRefs === true) &&
      (params.execution === undefined
        ? explicitXMLPropertyValidationMode(rule.itemType, key, ruleProp.type)
        : params.execution.explicitXMLPropertyValidationMode(rule.itemType, key, ruleProp.type)) !== undefined
    if (!importsFromYAML && !validatesExplicitXML) continue

    const yamlKey = ruleProp.yaml
    if (!yamlKey) continue

    const value = metadataItem ? metadataItem[key] : undefined

    const exportedValue = exportPropertyToJSONSchema({
      context,
      rule: ruleProp,
      value,
      execution: params.execution,
    })
    if (exportedValue !== undefined) {
      const schema = withExplicitXMLValidationValue({
        context,
        itemType: rule.itemType,
        propertyKey: key,
        rule: ruleProp,
        schema: exportedValue,
        execution: params.execution,
      })
      const required = ruleProp.required === true
        && context.exportToJSONSchema?.requiredPolicy?.currentBoundary !== "defer"
      result[yamlKey] = required ? schema : Type.Optional(schema)
    }
  }

  return result
}

export const exportPropertyToJSONSchema = (params: {
  context: ConfigurationContext
  rule: PropertyRule
  value: any
  execution?: PropertyRuleExecution
}): TSchema | undefined => {
  const { context, rule, value } = params

  const overrideSchema = exportPropertyOverrideSchema({
    context,
    rule,
  })
  if (overrideSchema !== undefined) return withPropertyDescription(overrideSchema, rule.description)

  const externalRefSchema = exportPropertyExternalRefSchema({
    context,
    rule,
  })
  if (externalRefSchema !== undefined) return withPropertyDescription(externalRefSchema, rule.description)

  const exportedValue = params.execution === undefined
    ? getTypeRule(rule.type, "exportToJSONSchema")?.({ context, rule, value })
    : params.execution.toJSONSchema({ context, rule, value })

  if (exportedValue === undefined) {
    return value === undefined ? undefined : withPropertyDescription(value, rule.description)
  }

  const implicitYAML = getImplicitValueYAML(rule, params.execution)
  const schemaWithDefaults =
    context.exportToJSONSchema?.excludeImplicitValueYAML === true &&
    rule.preserveExplicitDefaultXML !== true &&
    implicitYAML !== undefined &&
    exportedValue !== undefined
      ? excludeImplicitValueFromSchema(exportedValue, implicitYAML)
      : exportedValue

  if (schemaWithDefaults === undefined) return undefined

  const completedSchema = applyExcludedEqualNameYAMLToJSONSchema({
    rule,
    schema: schemaWithDefaults,
  })

  const completed =
    exportValidationPropertyRefSchema({
      context,
      rule,
      schema: completedSchema,
      execution: params.execution,
    }) ?? completedSchema

  return withPropertyDescription(completed, rule.description)
}
