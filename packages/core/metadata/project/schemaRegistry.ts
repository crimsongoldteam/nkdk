import type { TSchema } from "typebox"
import type { ConfigurationContext, JSONSchemaExportMode } from "../context/types"
import {
  attachCollectedSchemaRefs,
  collectSchemaRefs,
  createJSONSchemaExportContext,
  JSON_SCHEMA_REF_PREFIX,
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
  return [...schemaExporters.keys()].sort()
}

export function exportJSONSchemaForSchemaName(params: {
  context: ConfigurationContext
  name: string
  mode?: JSONSchemaExportMode
  includeNestedChildItems?: boolean
}): TSchema {
  ensureJSONSchemaRegistry()

  const { context, includeNestedChildItems, name, mode = "externalRefs" } = params
  const exporter = schemaExporters.get(name)
  if (!exporter) {
    throw new ProjectFileSchemaError(
      `Неизвестная JSON Schema "${name}". Доступные имена: ${listJSONSchemaNames().join(", ")}`
    )
  }

  const schemaContext = createJSONSchemaExportContext(context, mode, { includeNestedChildItems })
  const schema = exporter({ context: schemaContext })

  return mode === "externalRefs" ? attachCollectedSchemaRefs(schemaContext, schema) : schema
}

export function exportJSONSchemaGraph(params: {
  context: ConfigurationContext
  roots: readonly JSONSchemaGraphRoot[]
  mode?: JSONSchemaExportMode
}): JSONSchemaGraph {
  ensureJSONSchemaRegistry()

  const roots: Record<string, TSchema> = {}
  const schemas: Record<string, TSchema> = {}
  const pendingRefs: string[] = []
  const mode = params.mode ?? "externalRefs"

  for (const root of params.roots) {
    const schema = exportJSONSchemaForSchemaName({
      context: params.context,
      name: root.name,
      mode,
      includeNestedChildItems: root.includeNestedChildItems,
    })
    roots[root.key] = schema
    pendingRefs.push(...collectSchemaRefs(schema))
  }

  for (let index = 0; index < pendingRefs.length; index += 1) {
    const ref = pendingRefs[index]
    if (ref === undefined || schemas[ref] !== undefined) continue

    const name = schemaNameFromRef(ref)
    const schema = withSchemaId(
      ref,
      exportJSONSchemaForSchemaName({
        context: params.context,
        name,
        mode,
      })
    )

    schemas[ref] = schema
    pendingRefs.push(...collectSchemaRefs(schema))
  }

  return { roots, schemas }
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

function withSchemaId(ref: string, schema: TSchema): TSchema {
  return { ...stripCollectedSchemaRefs(schema), $id: ref } as TSchema
}
