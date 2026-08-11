import type { TSchema } from "typebox"
import type { ConfigurationContext, JSONSchemaExportMode } from "@nkdk/runtime"
import {
  attachCollectedSchemaRefs,
  createJSONSchemaExportContext,
  encodeValidationSchemaKey,
  JSON_SCHEMA_REF_PREFIX,
} from "../ruleRuntime/jsonSchemaRefs"
import type {
  MetadataItemRule,
  PropertyRule,
  RuleRegistrySet,
  RuleSchemaGraph,
  RuleSchemaGraphRoot,
} from "@nkdk/runtime/rule-kit"
import { createRuleSchemaRuntime } from "@nkdk/runtime/rule-kit"
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

export type JSONSchemaGraphRoot = RuleSchemaGraphRoot
export type JSONSchemaGraph = RuleSchemaGraph

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
  const rules = currentRuleRegistrySet<RuleRegistrySet>()
  if (rules === undefined) {
    throw new ProjectFileSchemaError("Metadata rules runtime не задан")
  }
  return createRuleSchemaRuntime(
    rules,
    (name, available) => new ProjectFileSchemaError(
      `Неизвестная JSON Schema "${name}". Доступные имена: ${available.join(", ")}`,
    ),
  ).exportGraph(params)
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
