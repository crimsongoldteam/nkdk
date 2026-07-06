import { type TSchema } from "typebox"
import type { ConfigurationContext, JSONSchemaExportMode } from "../context/types"
import type { PropertyRuleType } from "./property/registry"
import type { PropertyRule } from "./property/types"

export const JSON_SCHEMA_REF_PREFIX = "nkdk://schema/"
const COLLECTED_SCHEMA_REFS_KEY = "x-nkdk-schemaRefs"

type PropertyRefFactory = (params: { context: ConfigurationContext; rule: PropertyRule }) => TSchema | undefined
type JSONSchemaExporter = (params: { context: ConfigurationContext }) => TSchema

interface JSONSchemaIdentityRegistration {
  exporter: JSONSchemaExporter
  source: object | string
}

const propertyRefFactories = new Map<PropertyRuleType, PropertyRefFactory>()
const schemaIdentityExporters = new Map<string, JSONSchemaIdentityRegistration>()

export function clearJSONSchemaRefRegistries(): void {
  propertyRefFactories.clear()
  schemaIdentityExporters.clear()
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

export function recordOfDiscriminatedOneOfSchemaRefs(names: readonly string[], propertyName: string): TSchema {
  return rawJSONSchema({
    type: "object",
    additionalProperties: {
      oneOf: names.map((name) => schemaRef(name)),
      discriminator: { propertyName },
    },
  })
}

export function registerJSONSchemaPropertyRef(type: PropertyRuleType, factory: PropertyRefFactory): void {
  propertyRefFactories.set(type, factory)
}

export function registerJSONSchemaIdentity(params: {
  name: string
  exporter: JSONSchemaExporter
  source: object | string
}): void {
  const existing = schemaIdentityExporters.get(params.name)
  if (existing !== undefined) {
    if (existing.source === params.source && existing.exporter === params.exporter) return
    throw new Error(`JSON Schema "${params.name}" already registered`)
  }

  schemaIdentityExporters.set(params.name, {
    exporter: params.exporter,
    source: params.source,
  })
}

export function getJSONSchemaIdentityExporter(name: string): JSONSchemaExporter | undefined {
  return schemaIdentityExporters.get(name)?.exporter
}

export function listJSONSchemaIdentityNames(): string[] {
  return [...schemaIdentityExporters.keys()].sort()
}

export function createJSONSchemaExportContext(
  context: ConfigurationContext,
  mode: JSONSchemaExportMode,
  options: { includeNestedChildItems?: boolean } = {}
): ConfigurationContext {
  return {
    ...context,
    exportToJSONSchema: {
      mode,
      refs: new Set<string>(),
      ...(options.includeNestedChildItems === undefined
        ? {}
        : { includeNestedChildItems: options.includeNestedChildItems }),
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
  if (schema) collectSchemaRefsToContext(context, schema)
  return schema
}

export function attachCollectedSchemaRefs(context: ConfigurationContext, schema: TSchema): TSchema {
  const refs = context.exportToJSONSchema?.refs
  if (!refs || refs.size === 0) return schema

  return {
    ...schema,
    [COLLECTED_SCHEMA_REFS_KEY]: [...refs].sort(),
  } as TSchema
}

export function collectSchemaRefs(schema: unknown): string[] {
  return [...new Set(findSchemaRefs(schema))].sort()
}

export function stripCollectedSchemaRefs<const Schema>(schema: Schema): Schema {
  return stripCollectedSchemaRefsNode(schema) as Schema
}

function collectSchemaRefsToContext(context: ConfigurationContext, schema: unknown): void {
  const refs = context.exportToJSONSchema?.refs
  if (!refs) return

  for (const ref of collectSchemaRefs(schema)) {
    refs.add(ref)
  }
}

function stripCollectedSchemaRefsNode(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripCollectedSchemaRefsNode)
  if (value === null || typeof value !== "object") return value

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key]) => key !== COLLECTED_SCHEMA_REFS_KEY)
      .map(([key, entry]) => [key, stripCollectedSchemaRefsNode(entry)])
  )
}

function findSchemaRefs(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => findSchemaRefs(item))
  }

  if (value === null || typeof value !== "object") return []

  const record = value as Record<string, unknown>
  const ownRef =
    typeof record["$ref"] === "string" && record["$ref"].startsWith(JSON_SCHEMA_REF_PREFIX) ? [record["$ref"]] : []
  const collectedRefs = Array.isArray(record[COLLECTED_SCHEMA_REFS_KEY])
    ? record[COLLECTED_SCHEMA_REFS_KEY].filter(
        (ref): ref is string => typeof ref === "string" && ref.startsWith(JSON_SCHEMA_REF_PREFIX)
      )
    : []

  return [...ownRef, ...collectedRefs, ...Object.values(record).flatMap((item) => findSchemaRefs(item))]
}

function rawJSONSchema(schema: object): TSchema {
  return schema as unknown as TSchema
}
