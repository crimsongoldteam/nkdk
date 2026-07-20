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
import * as SE from "../../systemEnumerations/types"

const systemEnumerationTables = SE as unknown as Record<string, Record<string, string>>

function notSchema(schema: TSchema): TSchema {
  return { not: schema } as TSchema
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
    return systemEnumerationTables[`${typeSE}ToYAML`]?.[v] ?? v
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
      result[yamlKey] = ruleProp.required === true ? exportedValue : Type.Optional(exportedValue)
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
  if (overrideSchema !== undefined) return overrideSchema

  const externalRefSchema = exportPropertyExternalRefSchema({
    context,
    rule,
  })
  if (externalRefSchema !== undefined) return externalRefSchema

  const typeExportFn = rule.type ? getTypeRule(rule.type, "exportToJSONSchema") : undefined

  if (!typeExportFn) {
    return value
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

  return (
    exportValidationPropertyRefSchema({
      context,
      rule,
      schema: completedSchema,
    }) ?? completedSchema
  )
}
