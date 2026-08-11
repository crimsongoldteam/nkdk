import type { TSchema } from "typebox"
import type { ConfigurationContext, JSONSchemaExportMode } from "@nkdk/runtime"
import {
  attachCollectedSchemaRefs,
  collectSchemaRefs,
  createJSONSchemaExportContext,
  decodeValidationSchemaKey,
  encodeValidationSchemaKey,
  JSON_SCHEMA_REF_PREFIX,
  stripCollectedSchemaRefs,
} from "../ruleRuntime/jsonSchemaRefs"
import type { MetadataItemRule, PropertyRule } from "@nkdk/runtime/rule-kit"
import { exportMetadataItemToJSONSchema } from "../ruleRuntime/metadataItem/toJSONSchema"
import { defineMetadataRules, type MetadataRulesDefinition } from "../ruleRuntime/definition"
import { emptyMetadataRules } from "../ruleRuntime/definition/testSupport"
import { currentRuleRegistrySet } from "@nkdk/runtime/rule-kit"

export class ProjectFileSchemaError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ProjectFileSchemaError"
  }
}

type SchemaExporter = (params: { context: ConfigurationContext }) => TSchema
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

export function listJSONSchemaNames(): string[] {
  const contextual = currentSchemaRegistry()
  return [...(contextual?.names() ?? [])].sort()
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
  return exportJSONSchemaForSchemaNameInSession(params, createJSONSchemaExportSession())
}

function exportJSONSchemaForSchemaNameInSession(params: {
  context: ConfigurationContext
  name: string
  mode?: JSONSchemaExportMode
  excludeImplicitValueYAML?: boolean
  includeNestedChildItems?: boolean
  validationPropertyRefs?: true
  requiredPolicy?: NonNullable<ConfigurationContext["exportToJSONSchema"]>["requiredPolicy"]
}, session: JSONSchemaExportSession): TSchema {
  const { context, excludeImplicitValueYAML, includeNestedChildItems, name, mode = "externalRefs", validationPropertyRefs, requiredPolicy } = params
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
    requiredPolicy,
    propertyRef: currentSchemaPropertyRef(),
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
            requiredPolicy: params.requiredPolicy,
          }, session)
        : exportJSONSchemaForMetadataItemRuleInSession({
            context: params.context,
            rule: root.rule,
            mode,
            excludeImplicitValueYAML: params.excludeImplicitValueYAML,
            includeNestedChildItems: root.includeNestedChildItems,
            validationPropertyRefs: params.validationPropertyRefs,
            requiredPolicy: params.requiredPolicy,
          }, session)
    const rewritten = params.validationPropertyRefs === true
      ? rewriteValidationRefs(params.context, schema)
      : schema
    roots[root.key] = rewritten
    pendingRefs.push(...collectSchemaRefs(rewritten))
  }

  for (let index = 0; index < pendingRefs.length; index += 1) {
    const ref = pendingRefs[index]
    if (ref === undefined || schemas[ref] !== undefined) continue

    const name = params.validationPropertyRefs === true
      ? validationSchemaName(params.context, ref)
      : schemaNameFromRef(ref)
    const exported = exportJSONSchemaForSchemaNameInSession({
      context: params.context,
      name,
      mode,
      excludeImplicitValueYAML: params.excludeImplicitValueYAML,
      validationPropertyRefs: params.validationPropertyRefs,
      requiredPolicy: params.requiredPolicy,
    }, session)
    const schema = withSchemaId(ref, params.validationPropertyRefs === true
      ? rewriteValidationRefs(params.context, exported)
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
  return exportJSONSchemaForMetadataItemRuleInSession(params, createJSONSchemaExportSession())
}

function exportJSONSchemaForMetadataItemRuleInSession(params: {
  context: ConfigurationContext
  rule: MetadataItemRule
  mode?: JSONSchemaExportMode
  excludeImplicitValueYAML?: boolean
  includeNestedChildItems?: boolean
  validationPropertyRefs?: true
  requiredPolicy?: NonNullable<ConfigurationContext["exportToJSONSchema"]>["requiredPolicy"]
}, session: JSONSchemaExportSession): TSchema {
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
    defineSchema: session.defineSchema,
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

function getSchemaExporter(name: string, session?: JSONSchemaExportSession): SchemaExporter | undefined {
  const contextual = currentRuleRegistrySet<{
    execution: object
    schemas: { get(name: string): { export: (params: { context: ConfigurationContext; execution: object }) => TSchema } | undefined }
  }>()
  const contextualDefinition = contextual?.schemas.get(name)
  const execution = contextual?.execution
  return session?.exporters.get(name) ??
    (contextualDefinition === undefined || execution === undefined
      ? undefined
      : ({ context }) => contextualDefinition.export({ context, execution })) ??
    undefined
}

function currentSchemaPropertyRef(): NonNullable<ConfigurationContext["exportToJSONSchema"]>["propertyRef"] | undefined {
  const contextual = currentRuleRegistrySet<{
    execution: object
    schemas: {
      propertyRef(type: string): ((params: { context: ConfigurationContext; rule: PropertyRule; execution: object }) => TSchema | undefined) | undefined
    }
  }>()
  if (contextual === undefined) return undefined
  return ({ context, rule }) => {
    const propertyRule = rule as PropertyRule
    return contextual.schemas.propertyRef(propertyRule.type)?.({
    context,
    rule: propertyRule,
    execution: contextual.execution,
  })
  }
}

function currentSchemaRegistry(): {
  get(name: string): { export: SchemaExporter } | undefined
  names(): Iterable<string>
} | undefined {
  return currentRuleRegistrySet<{ schemas: {
    get(name: string): { export: SchemaExporter } | undefined
    names(): Iterable<string>
  } }>()?.schemas
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
