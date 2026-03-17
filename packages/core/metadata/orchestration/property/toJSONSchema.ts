import { TSchema, Type } from "@sinclair/typebox"
import { ConfigurationContext } from "~/metadata/context/types"
import { getTypeRule } from "../formElement/factory"
import { MetadataItem, MetadataItemRule, PropertyRule } from "./types"

/**
 * Возвращает YAML-представление defaultValue (для исключения из JSON Schema).
 * Только для литеральных defaultValue, не для функций.
 */
function getDefaultValueYAML(rule: PropertyRule): string | number | undefined {
  const v = rule.defaultValue
  if (v === undefined || typeof v === "function") return undefined
  if (rule.type === "boolean") return v ? "Истина" : "Ложь"
  if (rule.type === "number" || rule.type === "string") return v
  if (rule.type === "SystemEnumeration" && typeof v === "string") return v
  return undefined
}

/**
 * Исключает значение по умолчанию из схемы (union/anyOf): убирает вариант с const === defaultYAML.
 */
function excludeDefaultFromSchema(schema: TSchema, defaultYAML: string | number): TSchema {
  const s = schema as { anyOf?: Array<{ const?: unknown }> }
  if (!s.anyOf || !Array.isArray(s.anyOf)) return schema
  const rest = s.anyOf.filter((opt) => opt.const !== defaultYAML)
  if (rest.length === 0) return schema
  if (rest.length === 1) return rest[0] as TSchema
  return Type.Union(rest as [TSchema, TSchema, ...TSchema[]])
}

export const exportPropertiesToJSONSchema = <T extends MetadataItem>(params: {
  context: ConfigurationContext
  rule: MetadataItemRule
  metadataItem?: T
}): TSchema => {
  const { context, metadataItem, rule } = params

  const result = {} as TSchema

  for (const [key, ruleProp] of Object.entries(rule.properties) as [
    keyof T extends string ? keyof T : never,
    PropertyRule,
  ][]) {
    // if (ruleProp.fromEnterprise === false) continue

    const yamlKey = ruleProp.yaml
    if (!yamlKey) continue

    const value = metadataItem ? metadataItem[key] : undefined

    const exportedValue = exportPropertyToJSONSchema({
      context,
      rule: ruleProp,
      value,
    })
    if (exportedValue !== undefined) {
      result[yamlKey] = Type.Optional(exportedValue)
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

  const typeExportFn = rule.type ? getTypeRule(rule.type, "exportToJSONSchema") : undefined

  if (!typeExportFn) {
    return value
  }

  const exportedValue = typeExportFn({
    context,
    rule,
    value,
  })

  const defaultYAML = getDefaultValueYAML(rule)
  if (defaultYAML !== undefined && exportedValue !== undefined) {
    return excludeDefaultFromSchema(exportedValue, defaultYAML)
  }

  return exportedValue
}
