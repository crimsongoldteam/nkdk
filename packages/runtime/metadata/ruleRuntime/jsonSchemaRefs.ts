import { type TSchema } from "typebox"
import type { ConfigurationContext, JSONSchemaExportMode } from "../context/types"
import type { PropertyRuleType } from "./property/registry"
import type { PropertyRule } from "./property/types"
import type { PropertyRuleExecution } from "./property/fn"
import { getTypeRule } from "./property/typeRuleRegistry"

export const JSON_SCHEMA_REF_PREFIX = "nkdk://schema/"
const COLLECTED_SCHEMA_REFS_KEY = "x-nkdk-schemaRefs"

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

export function arrayOfSchemaRef(name: string): TSchema {
  return rawJSONSchema({
    type: "array",
    items: schemaRef(name),
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

export function createJSONSchemaExportContext(
  context: ConfigurationContext,
  mode: JSONSchemaExportMode,
  options: {
    excludeImplicitValueYAML?: boolean
    includeNestedChildItems?: boolean
    validationPropertyRefs?: true
    defineSchema?: NonNullable<ConfigurationContext["exportToJSONSchema"]>["defineSchema"]
    propertyRef?: NonNullable<ConfigurationContext["exportToJSONSchema"]>["propertyRef"]
    requiredPolicy?: NonNullable<ConfigurationContext["exportToJSONSchema"]>["requiredPolicy"]
  } = {}
): ConfigurationContext {
  return {
    ...context,
    exportToJSONSchema: {
      mode,
      refs: new Set<string>(),
      ...(options.excludeImplicitValueYAML === undefined
        ? {}
        : { excludeImplicitValueYAML: options.excludeImplicitValueYAML }),
      ...(options.includeNestedChildItems === undefined
        ? {}
        : { includeNestedChildItems: options.includeNestedChildItems }),
      ...(options.validationPropertyRefs === undefined
        ? {}
        : { validationPropertyRefs: options.validationPropertyRefs }),
      ...(options.defineSchema === undefined
        ? {}
        : { defineSchema: options.defineSchema }),
      ...(options.propertyRef === undefined
        ? {}
        : { propertyRef: options.propertyRef }),
      ...(options.requiredPolicy === undefined ? {} : { requiredPolicy: options.requiredPolicy }),
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
  const { context } = params
  if (context.exportToJSONSchema?.mode !== "externalRefs") return undefined

  const factory = context.exportToJSONSchema.propertyRef
  if (!factory) return undefined

  const schema = factory(params)
  if (schema) collectSchemaRefsToContext(context, schema)
  return schema
}

export function exportValidationPropertyRefSchema(params: {
  context: ConfigurationContext
  rule: PropertyRule
  schema: TSchema
  execution?: PropertyRuleExecution
}): TSchema | undefined {
  const { context, rule, schema } = params
  if (context.exportToJSONSchema?.validationPropertyRefs !== true) return undefined
  if (isValidationInlinePropertyRule(rule)) return undefined

  const key = (params.execution === undefined
    ? getTypeRule(rule.type, "validationSchemaRef")?.(params)
    : params.execution.validationSchemaRef(params))
    ?? defaultValidationSchemaRefKey({ rule })
  if (key === undefined) return undefined

  const name = validationSchemaRefName(context, key)
  context.exportToJSONSchema.defineSchema?.(key, () => schema)
  collectSchemaRefsToContext(context, rawJSONSchema({ $ref: name }))
  return rawJSONSchema({ $ref: name })
}

export function isValidationInlinePropertyRule(rule: PropertyRule): boolean {
  if (rule.type === "DataPath" || rule.type === "Events") return true

  if (
    rule.type === "MetadataItemLink" ||
    rule.type === "MetadataItemLinks" ||
    rule.type === "MetadataField" ||
    rule.type === "MetadataFields" ||
    rule.type === "MetadataObjectRefCollection" ||
    rule.type === "MetadataValue"
  ) {
    return true
  }

  if (rule.type === "string" && rule.metadataTarget !== undefined) return true
  if (rule.type === "TypeDescription" && rule.allowedTypes !== undefined) return true

  return false
}

export function defaultValidationSchemaRefKey(params: { rule: PropertyRule }): string | undefined {
  const { rule } = params
  if (typeof rule.type !== "string" || rule.type.length === 0) return undefined
  return `${rule.type}/base`
}

export function encodeValidationSchemaKey(key: string): string {
  return key.split("/").map(encodeValidationSchemaKeySegment).join("/")
}

export function decodeValidationSchemaKey(key: string): string {
  return key.split("/").map(decodeURIComponent).join("/")
}

function validationSchemaRefName(context: ConfigurationContext, key: string): string {
  return createSchemaRef(`validation/${context.version}/${context.defaultLanguage}/${encodeValidationSchemaKey(key)}`)
}

function encodeValidationSchemaKeySegment(segment: string): string {
  try {
    return encodeURIComponent(decodeURIComponent(segment))
  } catch {
    return encodeURIComponent(segment)
  }
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
