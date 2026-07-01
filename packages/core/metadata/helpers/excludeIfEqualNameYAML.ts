import { Type, type TSchema } from "@sinclair/typebox"
import type { ConfigurationContext } from "~/metadata/context/types"
import type { PropertyRule } from "~/metadata/orchestration/property/types"
import { canConvertToPascalCase, splitPascalCase } from "./canConvertToPascalCase"

type YamlPath = readonly (string | number)[]

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
  context: Pick<ConfigurationContext, "defaultLanguage">
  rule: PropertyRule
  schema: TSchema
  name: string | undefined
}

export function isExcludeIfEqualNameYAMLTextRule(rule: PropertyRule): boolean {
  return (
    rule.excludeIfEqualNameYAML === true &&
    (rule.type === "I8nText" || rule.type === "FormattedI8nText")
  )
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

export function applyExcludedEqualNameYAMLToJSONSchema(
  params: ApplyExcludedEqualNameYAMLToJSONSchemaParams
): TSchema {
  const { context, rule, schema, name } = params
  if (!name || !isExcludeIfEqualNameYAMLTextRule(rule)) return schema

  const excludedText = splitPascalCase(name)
  const forbiddenText = forbiddenI8nTextSchema(context.defaultLanguage, excludedText)
  const forbiddenValue =
    rule.type === "FormattedI8nText"
      ? Type.Object({ Текст: forbiddenText }, { additionalProperties: true })
      : forbiddenText

  return Type.Intersect([schema, Type.Not(forbiddenValue)])
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

function forbiddenI8nTextSchema(defaultLanguage: string, excludedText: string): TSchema {
  return Type.Union([
    Type.Literal(excludedText),
    Type.Object({ [defaultLanguage]: Type.Literal(excludedText) }, { additionalProperties: true }),
  ])
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined
}
