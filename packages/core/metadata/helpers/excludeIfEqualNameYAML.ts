import type { TSchema } from "typebox"
import type { ConfigurationContext } from "../context/types"
import type { PropertyRule } from "../orchestration/property/types"
import { canConvertToPascalCase } from "./canConvertToPascalCase"

type YamlPath = readonly (string | number)[]

export const EXCLUDE_IF_EQUAL_NAME_YAML_DESCRIPTION =
  "Не указывайте это поле, если значение совпадает с именем объекта/элемента после нормализации пробелов и PascalCase."

export interface ExcludedEqualNameYAMLOccurrence {
  path: YamlPath
  value: string
}

export interface FindExcludedEqualNameYAMLOccurrenceParams {
  context: Pick<ConfigurationContext, "defaultLanguage">
  rule: PropertyRule
  value: unknown
  name: string | undefined
  path: YamlPath
}

export interface ApplyExcludedEqualNameYAMLToJSONSchemaParams {
  rule: PropertyRule
  schema: TSchema
}

export function isExcludeIfEqualNameYAMLTextRule(rule: PropertyRule): boolean {
  return rule.excludeIfEqualNameYAML === true && (rule.type === "I8nText" || rule.type === "FormattedI8nText")
}

export function findExcludedEqualNameYAMLOccurrence(
  params: FindExcludedEqualNameYAMLOccurrenceParams
): ExcludedEqualNameYAMLOccurrence | undefined {
  const { context, rule, value, name, path } = params
  if (!name || !isExcludeIfEqualNameYAMLTextRule(rule)) return undefined

  if (rule.type === "FormattedI8nText") {
    const record = asRecord(value)
    if (!record) return undefined

    return findI8nTextOccurrence({
      context,
      value: record["Текст"],
      name,
      path: [...path, "Текст"],
    })
  }

  return findI8nTextOccurrence({ context, value, name, path })
}

export function applyExcludedEqualNameYAMLToJSONSchema(params: ApplyExcludedEqualNameYAMLToJSONSchemaParams): TSchema {
  const { rule, schema } = params
  if (!isExcludeIfEqualNameYAMLTextRule(rule)) return schema

  return withDescription(schema, EXCLUDE_IF_EQUAL_NAME_YAML_DESCRIPTION)
}

function findI8nTextOccurrence(params: {
  context: Pick<ConfigurationContext, "defaultLanguage">
  value: unknown
  name: string
  path: YamlPath
}): ExcludedEqualNameYAMLOccurrence | undefined {
  const { context, value, name, path } = params

  if (typeof value === "string") {
    return canConvertToPascalCase(value, name) ? { path, value } : undefined
  }

  const record = asRecord(value)
  if (!record) return undefined

  const defaultLanguageValue = record[context.defaultLanguage]
  if (typeof defaultLanguageValue !== "string") return undefined

  return canConvertToPascalCase(defaultLanguageValue, name)
    ? { path: [...path, context.defaultLanguage], value: defaultLanguageValue }
    : undefined
}

function withDescription(schema: TSchema, description: string): TSchema {
  const currentDescription = (schema as { description?: unknown }).description
  if (typeof currentDescription === "string") {
    if (currentDescription.includes(description)) return schema

    return { ...schema, description: `${currentDescription}\n\n${description}` } as TSchema
  }

  return { ...schema, description } as TSchema
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined
}
