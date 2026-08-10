import type { TSchema } from "typebox"
import type { ConfigurationContext, JSONSchemaExportMode } from "../context/types"
import {
  attachCollectedSchemaRefs,
  collectSchemaRefs,
  createJSONSchemaExportContext,
  decodeValidationSchemaKey,
  encodeValidationSchemaKey,
  getValidationSchemaRef,
  getJSONSchemaIdentityExporter,
  JSON_SCHEMA_REF_PREFIX,
  listJSONSchemaIdentityNames,
  recordOfSchemaRef,
  registerJSONSchemaPropertyRef,
  stripCollectedSchemaRefs,
} from "../ruleRuntime/jsonSchemaRefs"
import type { PropertyRuleType } from "../ruleRuntime/property/registry"
import type { MetadataItemRule, PropertyRule } from "../ruleRuntime/property/types"
import { exportMetadataItemToJSONSchema } from "../ruleRuntime/metadataItem/toJSONSchema"

export class ProjectFileSchemaError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ProjectFileSchemaError"
  }
}

type SchemaExporter = (params: { context: ConfigurationContext }) => TSchema
type SchemaRefFactory = (params: { context: ConfigurationContext; rule: PropertyRule }) => TSchema | undefined

export type JSONSchemaGraphRoot =
  | {
      key: string
      name: string
      rule?: never
      includeNestedChildItems?: boolean
    }
  | {
      key: string
      rule: MetadataItemRule
      name?: never
      includeNestedChildItems?: boolean
    }

export interface JSONSchemaGraph {
  roots: Record<string, TSchema>
  schemas: Record<string, TSchema>
}

const schemaExporters = new Map<string, SchemaExporter>()
const schemaRefFactories = new Map<PropertyRuleType, SchemaRefFactory>()
let namedSchemasInitialized = false

export function listJSONSchemaNames(): string[] {
  ensureJSONSchemaRegistry()
  return [...new Set([...schemaExporters.keys(), ...listJSONSchemaIdentityNames()])].sort()
}

export function exportJSONSchemaForSchemaName(params: {
  context: ConfigurationContext
  name: string
  mode?: JSONSchemaExportMode
  excludeImplicitValueYAML?: boolean
  includeNestedChildItems?: boolean
  validationPropertyRefs?: true
  requiredPolicy?: NonNullable<ConfigurationContext["exportToJSONSchema"]>["requiredPolicy"]
}): TSchema {
  ensureJSONSchemaRegistry()

  const { context, excludeImplicitValueYAML, includeNestedChildItems, name, mode = "externalRefs", validationPropertyRefs, requiredPolicy } = params
  const exporter = getSchemaExporter(name) ?? getSchemaExporter(encodeValidationSchemaKey(name))
  if (!exporter) {
    throw new ProjectFileSchemaError(
      `Неизвестная JSON Schema "${name}". Доступные имена: ${listJSONSchemaNames().join(", ")}`
    )
  }

  const schemaContext = createJSONSchemaExportContext(context, mode, {
    excludeImplicitValueYAML,
    includeNestedChildItems,
    validationPropertyRefs,
    requiredPolicy,
  })
  const schema = exporter({ context: schemaContext })

  return mode === "externalRefs" ? attachCollectedSchemaRefs(schemaContext, schema) : schema
}

export function exportJSONSchemaGraph(params: {
  context: ConfigurationContext
  roots: readonly JSONSchemaGraphRoot[]
  mode?: JSONSchemaExportMode
  excludeImplicitValueYAML?: boolean
  validationPropertyRefs?: true
  requiredPolicy?: NonNullable<ConfigurationContext["exportToJSONSchema"]>["requiredPolicy"]
}): JSONSchemaGraph {
  ensureJSONSchemaRegistry()

  const roots: Record<string, TSchema> = {}
  const schemas: Record<string, TSchema> = {}
  const pendingRefs: string[] = []
  const mode = params.validationPropertyRefs === true ? "externalRefs" : (params.mode ?? "externalRefs")

  for (const root of params.roots) {
    const schema =
      root.rule === undefined
        ? exportJSONSchemaForSchemaName({
            context: params.context,
            name: root.name,
            mode,
            excludeImplicitValueYAML: params.excludeImplicitValueYAML,
            includeNestedChildItems: root.includeNestedChildItems,
            validationPropertyRefs: params.validationPropertyRefs,
            requiredPolicy: params.requiredPolicy,
          })
        : exportJSONSchemaForMetadataItemRule({
            context: params.context,
            rule: root.rule,
            mode,
            excludeImplicitValueYAML: params.excludeImplicitValueYAML,
            includeNestedChildItems: root.includeNestedChildItems,
            validationPropertyRefs: params.validationPropertyRefs,
            requiredPolicy: params.requiredPolicy,
          })
    const rewritten = params.validationPropertyRefs === true
      ? rewriteValidationRefs(params.context, schema, params.requiredPolicy)
      : schema
    roots[root.key] = rewritten
    pendingRefs.push(...collectSchemaRefs(rewritten))
  }

  for (let index = 0; index < pendingRefs.length; index += 1) {
    const ref = pendingRefs[index]
    if (ref === undefined || schemas[ref] !== undefined) continue

    const validationSchema = params.validationPropertyRefs === true ? getValidationSchemaRef(ref) : undefined
    const name = params.validationPropertyRefs === true
      ? validationSchemaName(params.context, ref, params.requiredPolicy)
      : schemaNameFromRef(ref)
    const exported = validationSchema ?? exportJSONSchemaForSchemaName({
      context: params.context,
      name,
      mode,
      excludeImplicitValueYAML: params.excludeImplicitValueYAML,
      validationPropertyRefs: params.validationPropertyRefs,
      requiredPolicy: params.requiredPolicy,
    })
    const schema = withSchemaId(ref, params.validationPropertyRefs === true
      ? rewriteValidationRefs(params.context, exported, params.requiredPolicy)
      : exported)

    schemas[ref] = schema
    pendingRefs.push(...collectSchemaRefs(schema))
  }

  return { roots, schemas }
}

export function exportJSONSchemaForMetadataItemRule(params: {
  context: ConfigurationContext
  rule: MetadataItemRule
  mode?: JSONSchemaExportMode
  excludeImplicitValueYAML?: boolean
  includeNestedChildItems?: boolean
  validationPropertyRefs?: true
  requiredPolicy?: NonNullable<ConfigurationContext["exportToJSONSchema"]>["requiredPolicy"]
}): TSchema {
  ensureJSONSchemaRegistry()
  const {
    context,
    rule,
    excludeImplicitValueYAML,
    includeNestedChildItems,
    validationPropertyRefs,
    requiredPolicy,
    mode = "externalRefs",
  } = params
  const schemaContext = createJSONSchemaExportContext(context, mode, {
    excludeImplicitValueYAML,
    includeNestedChildItems,
    validationPropertyRefs,
    requiredPolicy,
  })
  const schema = exportMetadataItemToJSONSchema({
    context: schemaContext,
    rule,
  })
  return mode === "externalRefs"
    ? attachCollectedSchemaRefs(schemaContext, schema)
    : schema
}

function validationSchemaName(
  context: ConfigurationContext,
  ref: string,
  requiredPolicy?: NonNullable<ConfigurationContext["exportToJSONSchema"]>["requiredPolicy"],
): string {
  const prefix = validationSchemaPrefix(context, requiredPolicy)
  if (!ref.startsWith(prefix)) throw new ProjectFileSchemaError(`Некорректная validation JSON Schema ссылка "${ref}"`)
  return decodeValidationSchemaKey(ref.slice(prefix.length))
}

function rewriteValidationRefs(
  context: ConfigurationContext,
  schema: TSchema,
  requiredPolicy?: NonNullable<ConfigurationContext["exportToJSONSchema"]>["requiredPolicy"],
): TSchema {
  const prefix = validationSchemaPrefix(context, requiredPolicy)
  const rewrite = (value: unknown): unknown => {
    if (typeof value === "string" && value.startsWith(JSON_SCHEMA_REF_PREFIX) && !value.startsWith(prefix)) {
      return `${prefix}${encodeValidationSchemaKey(value.slice(JSON_SCHEMA_REF_PREFIX.length))}`
    }
    if (Array.isArray(value)) return value.map(rewrite)
    if (value === null || typeof value !== "object") return value
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, entry]) => {
      return [key, rewrite(entry)]
    }))
  }
  return rewrite(schema) as TSchema
}

function validationSchemaPrefix(
  context: ConfigurationContext,
  requiredPolicy?: NonNullable<ConfigurationContext["exportToJSONSchema"]>["requiredPolicy"],
): string {
  const variant = requiredPolicy?.cacheVariant ?? "full"
  const variantPath = variant === "full" ? "" : `${variant}/`
  return `${JSON_SCHEMA_REF_PREFIX}validation/${context.version}/${context.defaultLanguage}/${variantPath}`
}

export function schemaNameFromRef(ref: string): string {
  if (!ref.startsWith(JSON_SCHEMA_REF_PREFIX)) {
    throw new ProjectFileSchemaError(`Некорректная JSON Schema ссылка "${ref}"`)
  }
  return ref.slice(JSON_SCHEMA_REF_PREFIX.length)
}

export function ensureJSONSchemaRegistry(): void {
  for (const [type, factory] of schemaRefFactories) {
    registerJSONSchemaPropertyRef(type, factory)
  }
  if (namedSchemasInitialized) return

  namedSchemasInitialized = true
}

export function registerProjectJSONSchema(name: string, exporter: SchemaExporter): void {
  schemaExporters.set(name, exporter)
}

export function registerProjectJSONSchemaPropertyRef(type: PropertyRuleType, schemaName: string): void {
  registerProjectJSONSchemaPropertyRefFactory(type, () => recordOfSchemaRef(schemaName))
}

export function registerProjectJSONSchemaPropertyRefFactory(type: PropertyRuleType, factory: SchemaRefFactory): void {
  schemaRefFactories.set(type, factory)
  registerJSONSchemaPropertyRef(type, factory)
}

function getSchemaExporter(name: string): SchemaExporter | undefined {
  return schemaExporters.get(name) ?? getJSONSchemaIdentityExporter(name)
}

function withSchemaId(ref: string, schema: TSchema): TSchema {
  return { ...stripCollectedSchemaRefs(schema), $id: ref } as TSchema
}
