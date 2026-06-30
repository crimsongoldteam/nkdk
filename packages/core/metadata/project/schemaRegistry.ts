import type { TSchema } from "@sinclair/typebox"
import type { ConfigurationContext, JSONSchemaExportMode } from "~/metadata/context/types"
import {
  attachCollectedSchemaRefs,
  createJSONSchemaExportContext,
  recordOfOneOfSchemaRefs,
  recordOfSchemaRef,
  registerJSONSchemaPropertyRef,
} from "~/metadata/orchestration/jsonSchemaRefs"
import type { PropertyRuleType } from "~/metadata/orchestration/property/registry"

export class ProjectFileSchemaError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ProjectFileSchemaError"
  }
}

type SchemaExporter = (params: { context: ConfigurationContext }) => TSchema
type SchemaRefFactory = () => ReturnType<typeof recordOfSchemaRef> | ReturnType<typeof recordOfOneOfSchemaRefs>

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
}): TSchema {
  ensureJSONSchemaRegistry()

  const { context, name, mode = "externalRefs" } = params
  const exporter = schemaExporters.get(name)
  if (!exporter) {
    throw new ProjectFileSchemaError(
      `Неизвестная JSON Schema "${name}". Доступные имена: ${listJSONSchemaNames().join(", ")}`
    )
  }

  const schemaContext = createJSONSchemaExportContext(context, mode)
  const schema = exporter({ context: schemaContext })

  return mode === "externalRefs" ? attachCollectedSchemaRefs(schemaContext, schema) : schema
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
