import type { TSchema } from "@sinclair/typebox"
import type { ConfigurationContext } from "../context/types"
import { attachCollectedSchemaRefs, createJSONSchemaExportContext } from "../orchestration/jsonSchemaRefs"
import { importMetadataItemFromYAML } from "../orchestration/metadataItem/fromYAML"
import { exportMetadataItemToJSONSchema } from "../orchestration/metadataItem/toJSONSchema"
import type { MetadataItem, MetadataItemRule } from "../orchestration/property/types"
import type { RegisteredProjectSpec } from "./projectSpecRegistry"

export function createMetadataItemProjectSchemaExporter(rule: MetadataItemRule): RegisteredProjectSpec["exportSchema"] {
  return createProjectSchemaExporter(({ context }) => exportMetadataItemToJSONSchema({ context, rule }))
}

export function createProjectSchemaExporter(
  exporter: (params: { context: ConfigurationContext }) => TSchema
): RegisteredProjectSpec["exportSchema"] {
  return ({ context, mode = "externalRefs" }) => {
    const schemaContext = createJSONSchemaExportContext(context, mode)
    const schema = exporter({ context: schemaContext })

    return mode === "externalRefs" ? attachCollectedSchemaRefs(schemaContext, schema) : schema
  }
}

export function createGenericProjectImportModel(rule: MetadataItemRule): RegisteredProjectSpec["importModel"] {
  return ({ context, parsed, name }) => {
    const model: unknown = importMetadataItemFromYAML({ context, yaml: parsed.data, rule, name })

    return isMetadataItem(model) ? model : undefined
  }
}

function isMetadataItem(value: unknown): value is MetadataItem {
  return typeof value === "object" && value !== null && "itemType" in value
}
