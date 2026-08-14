import type { TSchema } from "typebox"

import type { ConfigurationContext, JSONSchemaExportMode } from "../context/types"
import {
  attachCollectedSchemaRefs,
  collectSchemaRefs,
  createJSONSchemaExportContext,
  decodeValidationSchemaKey,
  encodeValidationSchemaKey,
  JSON_SCHEMA_REF_PREFIX,
  stripCollectedSchemaRefs,
} from "./jsonSchemaRefs"
import type { MetadataSchemaDefinition } from "./definition"
import type { RuleRegistrySet } from "./ruleRegistrySet"
import type { PropertyRule } from "./property/types"
import type { MetadataItemRule } from "./property/types"
import { exportMetadataItemToJSONSchema } from "./metadataItem/toJSONSchema"

export interface ExportRuleSchemaParams {
  readonly context: ConfigurationContext
  readonly mode?: JSONSchemaExportMode
  readonly excludeImplicitValueYAML?: boolean
  readonly includeNestedChildItems?: boolean
  readonly explicitXMLValues?: true
  readonly validationPropertyRefs?: true
  readonly requiredPolicy?: NonNullable<ConfigurationContext["exportToJSONSchema"]>["requiredPolicy"]
}

export interface ExportRuleSchemaGraphParams extends Omit<ExportRuleSchemaParams, "includeNestedChildItems"> {
  readonly roots: readonly RuleSchemaGraphRoot[]
  readonly validationPropertyRefs?: true
}

export type RuleSchemaGraphRoot = {
  readonly key: string
  readonly includeNestedChildItems?: boolean
} & (
  | { readonly name: string; readonly rule?: never }
  | { readonly rule: MetadataItemRule; readonly name?: never }
)

export interface RuleSchemaGraph {
  readonly roots: Record<string, TSchema>
  readonly schemas: Record<string, TSchema>
}

export interface ExportRuleSchemaByNameParams extends ExportRuleSchemaParams {
  readonly name: string
}

export interface RuleSchemaRuntime {
  exportByName(params: ExportRuleSchemaByNameParams): TSchema
  exportDefinition(params: ExportRuleSchemaParams & {
    readonly definition: MetadataSchemaDefinition
  }): TSchema
  exportRule(params: ExportRuleSchemaParams & {
    readonly rule: MetadataItemRule
  }): TSchema
  exportGraph(params: ExportRuleSchemaGraphParams): RuleSchemaGraph
}

export function createRuleSchemaRuntime(
  rules: RuleRegistrySet,
  unknownSchemaError: (name: string, availableNames: readonly string[]) => Error,
): RuleSchemaRuntime {
  const execution = rules.execution
  return {
    exportByName(params) {
      const { context, dynamicSchemas } = createExportSession(params, rules)
      const definition = rules.schemas.get(params.name) ?? dynamicSchemas.get(params.name)
      if (definition === undefined) {
        throw unknownSchemaError(params.name, listSchemaNames(rules))
      }
      const schema = definition.export({ context, execution })
      return finishExport(context, schema)
    },
    exportDefinition(params) {
      const { context } = createExportSession(params, rules)
      return finishExport(
        context,
        params.definition.export({ context, execution }),
      )
    },
    exportRule(params) {
      const { context } = createExportSession(params, rules)
      return finishExport(
        context,
        exportMetadataItemToJSONSchema({
          context,
          rule: params.rule,
          execution,
        }),
      )
    },
    exportGraph(params) {
      return exportSchemaGraph(params, rules, unknownSchemaError)
    },
  }
}

function createExportSession(
  params: ExportRuleSchemaParams,
  rules: RuleRegistrySet,
  dynamicSchemas = new Map<string, MetadataSchemaDefinition>(),
): {
  readonly context: ConfigurationContext
  readonly dynamicSchemas: Map<string, MetadataSchemaDefinition>
} {
  const defineSchema = (
    name: string,
    exporter: MetadataSchemaDefinition["export"],
  ): void => {
    dynamicSchemas.set(name, { export: exporter })
  }
  const execution = rules.execution
  return {
    dynamicSchemas,
    context: createJSONSchemaExportContext(
      params.context,
      params.mode ?? "externalRefs",
      {
        excludeImplicitValueYAML: params.excludeImplicitValueYAML,
        includeNestedChildItems: params.includeNestedChildItems,
        explicitXMLValues: params.explicitXMLValues,
        validationPropertyRefs: params.validationPropertyRefs,
        requiredPolicy: params.requiredPolicy,
        defineSchema,
        propertyRef: ({ context, rule }) => {
          const propertyRule = asPropertyRule(rule)
          return rules.schemas.propertyRef(propertyRule.type)?.({
            context,
            rule: propertyRule,
            execution,
          })
        },
      },
    ),
  }
}

function exportSchemaGraph(
  params: ExportRuleSchemaGraphParams,
  rules: RuleRegistrySet,
  unknownSchemaError: (name: string, availableNames: readonly string[]) => Error,
): RuleSchemaGraph {
  const roots: Record<string, TSchema> = {}
  const schemas: Record<string, TSchema> = {}
  const pendingRefs: string[] = []
  const dynamicSchemas = new Map<string, MetadataSchemaDefinition>()
  const mode = params.validationPropertyRefs === true
    ? "externalRefs"
    : (params.mode ?? "externalRefs")

  for (const root of params.roots) {
    const exported = root.rule === undefined
      ? exportByNameInGraphSession({ ...params, mode, name: root.name }, rules, dynamicSchemas, unknownSchemaError)
      : exportRuleInGraphSession({
          ...params,
          mode,
          rule: root.rule,
          includeNestedChildItems: root.includeNestedChildItems,
        }, rules, dynamicSchemas)
    const schema = params.validationPropertyRefs === true
      ? rewriteValidationRefs(params.context, exported)
      : exported
    roots[root.key] = schema
    pendingRefs.push(...collectSchemaRefs(schema))
  }

  for (let index = 0; index < pendingRefs.length; index += 1) {
    const ref = pendingRefs[index]
    if (ref === undefined || schemas[ref] !== undefined) continue

    const name = params.validationPropertyRefs === true
      ? validationSchemaName(params.context, ref)
      : schemaNameFromRef(ref)
    const exported = exportByNameInGraphSession(
      { ...params, name },
      rules,
      dynamicSchemas,
      unknownSchemaError,
    )
    const schema = withSchemaId(ref, params.validationPropertyRefs === true
      ? rewriteValidationRefs(params.context, exported)
      : exported)
    schemas[ref] = schema
    pendingRefs.push(...collectSchemaRefs(schema))
  }

  return { roots, schemas }
}

function exportByNameInGraphSession(
  params: ExportRuleSchemaByNameParams & { readonly validationPropertyRefs?: true },
  rules: RuleRegistrySet,
  dynamicSchemas: Map<string, MetadataSchemaDefinition>,
  unknownSchemaError: (name: string, availableNames: readonly string[]) => Error,
): TSchema {
  const { context } = createExportSession(params, rules, dynamicSchemas)
  const encodedName = encodeValidationSchemaKey(params.name)
  const definition = rules.schemas.get(params.name)
    ?? dynamicSchemas.get(params.name)
    ?? rules.schemas.get(encodedName)
    ?? dynamicSchemas.get(encodedName)
  if (definition === undefined) throw unknownSchemaError(params.name, listSchemaNames(rules))
  return finishExport(context, definition.export({ context, execution: rules.execution }))
}

function exportRuleInGraphSession(
  params: ExportRuleSchemaParams & {
    readonly rule: MetadataItemRule
    readonly validationPropertyRefs?: true
  },
  rules: RuleRegistrySet,
  dynamicSchemas: Map<string, MetadataSchemaDefinition>,
): TSchema {
  const { context } = createExportSession(params, rules, dynamicSchemas)
  return finishExport(context, exportMetadataItemToJSONSchema({
    context,
    rule: params.rule,
    execution: rules.execution,
  }))
}

function validationSchemaName(context: ConfigurationContext, ref: string): string {
  const prefix = validationSchemaPrefix(context)
  if (!ref.startsWith(prefix)) throw new Error(`Некорректная validation JSON Schema ссылка "${ref}"`)
  return decodeValidationSchemaKey(ref.slice(prefix.length))
}

function rewriteValidationRefs(context: ConfigurationContext, schema: TSchema): TSchema {
  const prefix = validationSchemaPrefix(context)
  const rewrite = (value: unknown): unknown => {
    if (typeof value === "string" && value.startsWith(JSON_SCHEMA_REF_PREFIX) && !value.startsWith(prefix)) {
      return `${prefix}${encodeValidationSchemaKey(value.slice(JSON_SCHEMA_REF_PREFIX.length))}`
    }
    if (Array.isArray(value)) return value.map(rewrite)
    if (value === null || typeof value !== "object") return value
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, entry]) => [key, rewrite(entry)]))
  }
  return rewrite(schema) as TSchema
}

function validationSchemaPrefix(context: ConfigurationContext): string {
  return `${JSON_SCHEMA_REF_PREFIX}validation/${context.version}/${context.languages.default}/`
}

function schemaNameFromRef(ref: string): string {
  if (!ref.startsWith(JSON_SCHEMA_REF_PREFIX)) throw new Error(`Некорректная JSON Schema ссылка "${ref}"`)
  return ref.slice(JSON_SCHEMA_REF_PREFIX.length)
}

function withSchemaId(ref: string, schema: TSchema): TSchema {
  return { ...stripCollectedSchemaRefs(schema), $id: ref } as TSchema
}

function finishExport(context: ConfigurationContext, schema: TSchema): TSchema {
  return context.exportToJSONSchema?.mode === "externalRefs"
    ? attachCollectedSchemaRefs(context, schema)
    : schema
}

function asPropertyRule(rule: unknown): PropertyRule {
  return rule as PropertyRule
}

function listSchemaNames(rules: RuleRegistrySet): string[] {
  return [...rules.schemas.names()].sort()
}
