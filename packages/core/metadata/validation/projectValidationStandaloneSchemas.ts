import { Type, type TSchema } from "typebox"
import type { ConfigurationContext } from "../context/types"
import {
  collectSchemaRefs,
  JSON_SCHEMA_REF_PREFIX,
  stripCollectedSchemaRefs,
} from "../orchestration/jsonSchemaRefs"
import type { ExternalValidationProperty } from "../orchestration/property/types"
import { exportJSONSchemaForSchemaName } from "./projectFileSchema"
import { configurationValidationProjectSpec, validationProjectSpecs } from "./projectSpecs"

export interface ProjectValidationStandaloneSchemaSet {
  context: ConfigurationContext
  form: TSchema
  refs: Record<string, TSchema>
  byProjectDir: Record<string, TSchema>
}

export const defaultStandaloneValidationContext: ConfigurationContext = {
  version: "2.20",
  defaultLanguage: "ru",
  exportToYAML: { toTyped: false },
}

export function createProjectValidationStandaloneSchemaSet(
  context: ConfigurationContext = defaultStandaloneValidationContext
): ProjectValidationStandaloneSchemaSet {
  const specs = [configurationValidationProjectSpec, ...validationProjectSpecs]
  const byProjectDir = Object.fromEntries(
    specs.map((spec) => [spec.dir, createStandalonePropertiesSchema(context, spec)])
  )
  const form = stripExternalRefsForValidation(
    exportJSONSchemaForSchemaName({
      context,
      name: "ClientApplicationForm",
      mode: "externalRefs",
      includeNestedChildItems: true,
    })
  )

  return {
    context,
    form,
    refs: collectExternalRefSchemas(context, Object.values(byProjectDir)),
    byProjectDir,
  }
}

export function assertStandaloneValidationContext(
  actual: ConfigurationContext,
  expected: ConfigurationContext = defaultStandaloneValidationContext
): void {
  if (JSON.stringify(actual) === JSON.stringify(expected)) return

  throw new Error(
    `Standalone validation schemas were built for context ${JSON.stringify(
      actual
    )}, but validation requested ${JSON.stringify(expected)}`
  )
}

function createStandalonePropertiesSchema(
  context: ConfigurationContext,
  spec: typeof configurationValidationProjectSpec
): TSchema {
  if (spec.validationSchemaMode !== "externalRefs") {
    return spec.exportSchema({ context, mode: "inline" })
  }

  const rootSchema = stripCollectedSchemaRefs(spec.exportSchema({ context, mode: "externalRefs" }))
  return replaceExternalValidationProperties(rootSchema, spec.externalValidationProperties)
}

function replaceExternalValidationProperties(
  schema: TSchema,
  properties: readonly ExternalValidationProperty[] | undefined
): TSchema {
  if (properties === undefined || properties.length === 0) return schema

  const schemaProperties = (schema as { properties?: Record<string, TSchema> }).properties
  if (schemaProperties === undefined) return schema

  const nextProperties = { ...schemaProperties }
  for (const property of properties) {
    if (nextProperties[property.yaml] !== undefined) {
      nextProperties[property.yaml] = Type.Unknown()
    }
  }

  return { ...schema, properties: nextProperties } as TSchema
}

function stripExternalRefsForValidation(schema: TSchema): TSchema {
  return stripExternalRefs(schema) as TSchema
}

function stripExternalRefs(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripExternalRefs)
  if (value === null || typeof value !== "object") return value

  const record = value as Record<string, unknown>
  if (typeof record.$ref === "string" && record.$ref.startsWith(JSON_SCHEMA_REF_PREFIX)) {
    return Type.Any()
  }

  return Object.fromEntries(
    Object.entries(record).map(([key, entry]) => [
      key,
      key === "additionalProperties" && containsExternalRef(entry) ? true : stripExternalRefs(entry),
    ])
  )
}

function containsExternalRef(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsExternalRef)
  if (value === null || typeof value !== "object") return false

  const record = value as Record<string, unknown>
  if (typeof record.$ref === "string" && record.$ref.startsWith(JSON_SCHEMA_REF_PREFIX)) return true

  return Object.values(record).some(containsExternalRef)
}

function collectExternalRefSchemas(context: ConfigurationContext, roots: TSchema[]): Record<string, TSchema> {
  const schemas = new Map<string, TSchema>()
  const queue = roots.flatMap(collectSchemaRefs)

  for (let index = 0; index < queue.length; index += 1) {
    const ref = queue[index]!
    if (schemas.has(ref)) continue

    const schema = stripCollectedSchemaRefs(
      exportJSONSchemaForSchemaName({
        context,
        name: schemaNameFromRef(ref),
        mode: "externalRefs",
      })
    )
    schemas.set(ref, schema)
    queue.push(...collectSchemaRefs(schema))
  }

  return Object.fromEntries(schemas)
}

function schemaNameFromRef(ref: string): string {
  return ref.startsWith(JSON_SCHEMA_REF_PREFIX) ? ref.slice(JSON_SCHEMA_REF_PREFIX.length) : ref
}
