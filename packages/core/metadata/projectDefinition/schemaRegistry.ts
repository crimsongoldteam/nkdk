import type { TSchema } from "typebox"
import type { ConfigurationContext, JSONSchemaExportMode } from "@nkdk/runtime"
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
import type { PropertyRuleType } from "@nkdk/runtime/rule-kit"
import type { MetadataItemRule, PropertyRule } from "@nkdk/runtime/rule-kit"
import { exportMetadataItemToJSONSchema } from "../ruleRuntime/metadataItem/toJSONSchema"
import { defineMetadataRules, type MetadataRulesDefinition } from "../ruleRuntime/definition"
import { emptyMetadataRules } from "../ruleRuntime/definition/testSupport"

export class ProjectFileSchemaError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ProjectFileSchemaError"
  }
}

type SchemaExporter = (params: { context: ConfigurationContext }) => TSchema
type SchemaRefFactory = (params: { context: ConfigurationContext; rule: PropertyRule }) => TSchema | undefined

interface JSONSchemaExportSession {
  readonly exporters: Map<string, SchemaExporter>
  readonly defineSchema: (name: string, exporter: SchemaExporter) => void
}

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
}): TSchema {
  return exportJSONSchemaForSchemaNameInSession(params, createJSONSchemaExportSession())
}

function exportJSONSchemaForSchemaNameInSession(params: {
  context: ConfigurationContext
  name: string
  mode?: JSONSchemaExportMode
  excludeImplicitValueYAML?: boolean
  includeNestedChildItems?: boolean
  validationPropertyRefs?: true
}, session: JSONSchemaExportSession): TSchema {
  ensureJSONSchemaRegistry()

  const { context, excludeImplicitValueYAML, includeNestedChildItems, name, mode = "externalRefs", validationPropertyRefs } = params
  const exporter = getSchemaExporter(name, session) ?? getSchemaExporter(encodeValidationSchemaKey(name), session)
  if (!exporter) {
    throw new ProjectFileSchemaError(
      `Неизвестная JSON Schema "${name}". Доступные имена: ${listJSONSchemaNames().join(", ")}`
    )
  }

  const schemaContext = createJSONSchemaExportContext(context, mode, {
    excludeImplicitValueYAML,
    includeNestedChildItems,
    validationPropertyRefs,
    defineSchema: session.defineSchema,
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
  const session = createJSONSchemaExportSession()

  for (const root of params.roots) {
    const schema =
      root.rule === undefined
        ? exportJSONSchemaForSchemaNameInSession({
            context: params.context,
            name: root.name,
            mode,
            excludeImplicitValueYAML: params.excludeImplicitValueYAML,
            includeNestedChildItems: root.includeNestedChildItems,
            validationPropertyRefs: params.validationPropertyRefs,
          }, session)
        : exportJSONSchemaForMetadataItemRuleInSession({
            context: params.context,
            rule: root.rule,
            mode,
            excludeImplicitValueYAML: params.excludeImplicitValueYAML,
            includeNestedChildItems: root.includeNestedChildItems,
            validationPropertyRefs: params.validationPropertyRefs,
          }, session)
    const rewritten = params.validationPropertyRefs === true ? rewriteValidationRefs(params.context, schema) : schema
    roots[root.key] = rewritten
    pendingRefs.push(...collectSchemaRefs(rewritten))
  }

  for (let index = 0; index < pendingRefs.length; index += 1) {
    const ref = pendingRefs[index]
    if (ref === undefined || schemas[ref] !== undefined) continue

    const validationSchema = params.validationPropertyRefs === true ? getValidationSchemaRef(ref) : undefined
    const name = params.validationPropertyRefs === true ? validationSchemaName(params.context, ref) : schemaNameFromRef(ref)
    const exported = validationSchema ?? exportJSONSchemaForSchemaNameInSession({
      context: params.context,
      name,
      mode,
      excludeImplicitValueYAML: params.excludeImplicitValueYAML,
      validationPropertyRefs: params.validationPropertyRefs,
    }, session)
    const schema = withSchemaId(ref, params.validationPropertyRefs === true ? rewriteValidationRefs(params.context, exported) : exported)

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
}): TSchema {
  return exportJSONSchemaForMetadataItemRuleInSession(params, createJSONSchemaExportSession())
}

function exportJSONSchemaForMetadataItemRuleInSession(params: {
  context: ConfigurationContext
  rule: MetadataItemRule
  mode?: JSONSchemaExportMode
  excludeImplicitValueYAML?: boolean
  includeNestedChildItems?: boolean
  validationPropertyRefs?: true
}, session: JSONSchemaExportSession): TSchema {
  ensureJSONSchemaRegistry()
  const {
    context,
    rule,
    excludeImplicitValueYAML,
    includeNestedChildItems,
    validationPropertyRefs,
    mode = "externalRefs",
  } = params
  const schemaContext = createJSONSchemaExportContext(context, mode, {
    excludeImplicitValueYAML,
    includeNestedChildItems,
    validationPropertyRefs,
    defineSchema: session.defineSchema,
  })
  const schema = exportMetadataItemToJSONSchema({
    context: schemaContext,
    rule,
  })
  return mode === "externalRefs"
    ? attachCollectedSchemaRefs(schemaContext, schema)
    : schema
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

export function defineProjectJSONSchema(
  name: string,
  exporter: SchemaExporter,
  source: object | string = name,
): MetadataRulesDefinition<never> {
  return defineMetadataRules({
    ...emptyMetadataRules,
    schemas: {
      [name]: { source, export: exporter },
    },
  })
}

export function registerProjectJSONSchema(name: string, exporter: SchemaExporter): void {
  const definition = defineProjectJSONSchema(name, exporter)
  for (const [schemaName, schema] of Object.entries(definition.schemas)) {
    schemaExporters.set(schemaName, schema.export)
  }
}

export function registerProjectJSONSchemaPropertyRef(type: PropertyRuleType, schemaName: string): void {
  registerProjectJSONSchemaPropertyRefFactory(type, () => recordOfSchemaRef(schemaName))
}

export function registerProjectJSONSchemaPropertyRefFactory(type: PropertyRuleType, factory: SchemaRefFactory): void {
  schemaRefFactories.set(type, factory)
  registerJSONSchemaPropertyRef(type, factory)
}

function getSchemaExporter(name: string, session?: JSONSchemaExportSession): SchemaExporter | undefined {
  return session?.exporters.get(name) ?? schemaExporters.get(name) ?? getJSONSchemaIdentityExporter(name)
}

function createJSONSchemaExportSession(): JSONSchemaExportSession {
  const exporters = new Map<string, SchemaExporter>()
  return {
    exporters,
    defineSchema(name, exporter) {
      exporters.set(name, exporter)
    },
  }
}

function withSchemaId(ref: string, schema: TSchema): TSchema {
  return { ...stripCollectedSchemaRefs(schema), $id: ref } as TSchema
}
