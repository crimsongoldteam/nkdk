import { TProperties, TSchema, Type } from "typebox"
import { ConfigurationContext } from "../../context/types"
import { applyExcludedEqualNameYAMLToJSONSchema } from "../../helpers/excludeIfEqualNameYAML"
import { getTypeRule } from "./typeRuleRegistry"
import {
  exportPropertyExternalRefSchema,
  exportPropertyOverrideSchema,
  exportValidationPropertyRefSchema,
} from "../jsonSchemaRefs"
import { shouldProcessProperty } from "./helpers"
import type { MetadataItem, MetadataItemRule, PropertyRule } from "./types"
import { getSystemEnumeration } from "./systemEnumerationRegistry"
import { EMPTY_XML_TAG_VALUE } from "../../../yaml/scalarTags"
import { hasExplicitXMLPropertyRegistration } from "./explicitXMLPropertyRegistry"

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
  schema: TSchema
}): TSchema {
  if (params.context.exportToJSONSchema?.validationPropertyRefs !== true) return params.schema
  if (!hasExplicitXMLPropertyRegistration(params.itemType, params.propertyKey)) return params.schema
  return Type.Union([params.schema, Type.Literal(EMPTY_XML_TAG_VALUE)])
}

/**
 * Возвращает YAML-представление implicitValueYAML.
 * Только для литеральных значений: функции зависят от контекста объекта.
 */
function getImplicitValueYAML(rule: PropertyRule): string | number | undefined {
  const v = rule.implicitValueYAML
  if (v === undefined || typeof v === "function") return undefined
  if (rule.type === "boolean" && typeof v === "boolean") return v ? "Истина" : "Ложь"
  if (rule.type === "number" && typeof v === "number") return v
  if (rule.type === "string" && typeof v === "string") return v
  if (rule.type === "SystemEnumeration" && typeof v === "string") {
    const typeSE = (rule as { typeSE?: string }).typeSE
    if (typeSE === undefined) return v
    return getSystemEnumeration(typeSE)?.toYAML[v] ?? v
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
}): TProperties => {
  const { context, metadataItem, rule } = params

  const result: TProperties = {}

  for (const [key, ruleProp] of Object.entries(rule.properties) as [
    keyof T extends string ? keyof T : never,
    PropertyRule,
  ][]) {
    // if (ruleProp.fromEnterprise === false) continue
    if (!shouldProcessProperty({ rule: ruleProp, operation: "importFromYAML" })) continue

    const yamlKey = ruleProp.yaml
    if (!yamlKey) continue

    const value = metadataItem ? metadataItem[key] : undefined

    const exportedValue = exportPropertyToJSONSchema({
      context,
      rule: ruleProp,
      value,
    })
    if (exportedValue !== undefined) {
      const schema = withExplicitXMLValidationValue({
        context,
        itemType: rule.itemType,
        propertyKey: key,
        schema: exportedValue,
      })
      result[yamlKey] = ruleProp.required === true ? schema : Type.Optional(schema)
    }
  }

  return result
}

export const exportPropertyToJSONSchema = (params: {
  context: ConfigurationContext
  rule: PropertyRule
  value: any
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

  const typeExportFn = rule.type ? getTypeRule(rule.type, "exportToJSONSchema") : undefined

  if (!typeExportFn) {
    return value === undefined ? undefined : withPropertyDescription(value, rule.description)
  }

  const exportedValue = typeExportFn({
    context,
    rule,
    value,
  })

  const implicitYAML = getImplicitValueYAML(rule)
  const schemaWithDefaults =
    context.exportToJSONSchema?.excludeImplicitValueYAML === true &&
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
    }) ?? completedSchema

  return withPropertyDescription(completed, rule.description)
}
