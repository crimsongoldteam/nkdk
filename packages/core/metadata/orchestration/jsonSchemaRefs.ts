import { type TSchema } from "@sinclairtypebox"
import type { ConfigurationContext, JSONSchemaExportMode } from "../context/types"
import type { PropertyRuleType } from "./property/registry"
import type { PropertyRule } from "./property/types"

export const JSON_SCHEMA_REF_PREFIX = "nkdk://schema/"

type PropertyRefFactory = (params: { context: ConfigurationContext; rule: PropertyRule }) => TSchema | undefined

const propertyRefFactories = new Map<PropertyRuleType, PropertyRefFactory>()

export function clearJSONSchemaRefRegistries(): void {
  propertyRefFactories.clear()
}

export function createSchemaRef(name: string): string {
  return `${JSON_SCHEMA_REF_PREFIX}${name}`
}

export function schemaRef(name: string): TSchema {
  return rawJSONSchema({ $ref: createSchemaRef(name) })
}

export function recordOfSchemaRef(name: string): TSchema {
  return rawJSONSchema({
    type: "object",
    additionalProperties: schemaRef(name),
  })
}

export function recordOfOneOfSchemaRefs(names: readonly string[]): TSchema {
  return rawJSONSchema({
    type: "object",
    additionalProperties: {
      oneOf: names.map((name) => schemaRef(name)),
    },
  })
}

export function registerJSONSchemaPropertyRef(type: PropertyRuleType, factory: PropertyRefFactory): void {
  propertyRefFactories.set(type, factory)
}

export function createJSONSchemaExportContext(
  context: ConfigurationContext,
  mode: JSONSchemaExportMode
): ConfigurationContext {
  return {
    ...context,
    exportToJSONSchema: {
      mode,
      refs: new Set<string>(),
    },
  }
}

export function createJSONSchemaPropertyOverrideContext(
  context: ConfigurationContext,
  propertySchemaOverrides: Partial<Record<PropertyRuleType, TSchema>>
): ConfigurationContext {
  const exportToJSONSchema = context.exportToJSONSchema
  if (exportToJSONSchema === undefined) return context

  return {
    ...context,
    exportToJSONSchema: {
      ...exportToJSONSchema,
      propertySchemaOverrides: {
        ...exportToJSONSchema.propertySchemaOverrides,
        ...propertySchemaOverrides,
      },
    },
  }
}

export function exportPropertyOverrideSchema(params: {
  context: ConfigurationContext
  rule: PropertyRule
}): TSchema | undefined {
  return params.context.exportToJSONSchema?.propertySchemaOverrides?.[params.rule.type]
}

export function exportPropertyExternalRefSchema(params: {
  context: ConfigurationContext
  rule: PropertyRule
}): TSchema | undefined {
  const { context, rule } = params
  if (context.exportToJSONSchema?.mode !== "externalRefs") return undefined

  const factory = propertyRefFactories.get(rule.type)
  if (!factory) return undefined

  const schema = factory(params)
  if (schema) collectSchemaRefs(context, schema)
  return schema
}

export function attachCollectedSchemaRefs(context: ConfigurationContext, schema: TSchema): TSchema {
  const refs = context.exportToJSONSchema?.refs
  if (!refs || refs.size === 0) return schema

  return {
    ...schema,
    "x-nkdk-schemaRefs": [...refs].sort(),
  } as TSchema
}

function collectSchemaRefs(context: ConfigurationContext, schema: unknown): void {
  const refs = context.exportToJSONSchema?.refs
  if (!refs) return

  for (const ref of findSchemaRefs(schema)) {
    refs.add(ref)
  }
}

function findSchemaRefs(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => findSchemaRefs(item))
  }

  if (value === null || typeof value !== "object") return []

  const record = value as Record<string, unknown>
  const ownRef =
    typeof record["$ref"] === "string" && record["$ref"].startsWith(JSON_SCHEMA_REF_PREFIX) ? [record["$ref"]] : []

  return [...ownRef, ...Object.values(record).flatMap((item) => findSchemaRefs(item))]
}

function rawJSONSchema(schema: object): TSchema {
  return schema as unknown as TSchema
}
