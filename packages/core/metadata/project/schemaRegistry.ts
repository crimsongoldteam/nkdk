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
} from "../orchestration/jsonSchemaRefs"
import type { PropertyRuleType } from "../orchestration/property/registry"
import type { PropertyRule } from "../orchestration/property/types"

export class ProjectFileSchemaError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ProjectFileSchemaError"
  }
}

type SchemaExporter = (params: { context: ConfigurationContext }) => TSchema
type SchemaRefFactory = (params: { context: ConfigurationContext; rule: PropertyRule }) => TSchema | undefined

export interface JSONSchemaGraphRoot {
  key: string
  name: string
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
}): TSchema {
  ensureJSONSchemaRegistry()

  const { context, excludeImplicitValueYAML, includeNestedChildItems, name, mode = "externalRefs", validationPropertyRefs } = params
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
}): JSONSchemaGraph {
  ensureJSONSchemaRegistry()

  const roots: Record<string, TSchema> = {}
  const schemas: Record<string, TSchema> = {}
  const pendingRefs: string[] = []
  const mode = params.validationPropertyRefs === true ? "externalRefs" : (params.mode ?? "externalRefs")

  for (const root of params.roots) {
    const schema = exportJSONSchemaForSchemaName({
      context: params.context,
      name: root.name,
      mode,
      excludeImplicitValueYAML: params.excludeImplicitValueYAML,
      includeNestedChildItems: root.includeNestedChildItems,
      validationPropertyRefs: params.validationPropertyRefs,
    })
    const rewritten = params.validationPropertyRefs === true ? rewriteValidationRefs(params.context, schema) : schema
    roots[root.key] = rewritten
    pendingRefs.push(...collectSchemaRefs(rewritten))
  }

  for (let index = 0; index < pendingRefs.length; index += 1) {
    const ref = pendingRefs[index]
    if (ref === undefined || schemas[ref] !== undefined) continue

    const validationSchema = params.validationPropertyRefs === true ? getValidationSchemaRef(ref) : undefined
    const name = params.validationPropertyRefs === true ? validationSchemaName(params.context, ref) : schemaNameFromRef(ref)
    const exported = validationSchema ?? exportJSONSchemaForSchemaName({
      context: params.context,
      name,
      mode,
      excludeImplicitValueYAML: params.excludeImplicitValueYAML,
      validationPropertyRefs: params.validationPropertyRefs,
    })
    const schema = withSchemaId(ref, params.validationPropertyRefs === true ? rewriteValidationRefs(params.context, exported) : exported)

    schemas[ref] = schema
    pendingRefs.push(...collectSchemaRefs(schema))
  }

  return { roots, schemas }
}

function validationSchemaName(context: ConfigurationContext, ref: string): string {
  const prefix = `${JSON_SCHEMA_REF_PREFIX}validation/${context.version}/${context.defaultLanguage}/`
  if (!ref.startsWith(prefix)) throw new ProjectFileSchemaError(`Некорректная validation JSON Schema ссылка "${ref}"`)
  return decodeValidationSchemaKey(ref.slice(prefix.length))
}

function rewriteValidationRefs(context: ConfigurationContext, schema: TSchema): TSchema {
  const prefix = `${JSON_SCHEMA_REF_PREFIX}validation/${context.version}/${context.defaultLanguage}/`
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
