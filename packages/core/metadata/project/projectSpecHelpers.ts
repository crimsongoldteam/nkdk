import type { TSchema } from "@sinclair/typebox"
import type { ConfigurationContext } from "~/metadata/context/types"
import { attachCollectedSchemaRefs, createJSONSchemaExportContext } from "~/metadata/orchestration/jsonSchemaRefs"
import { importMetadataItemFromYAML } from "~/metadata/orchestration/metadataItem/fromYAML"
import { exportMetadataItemToJSONSchema } from "~/metadata/orchestration/metadataItem/toJSONSchema"
import type { MetadataItem, MetadataItemRule } from "~/metadata/orchestration/property/types"
import type { RegisteredProjectSpec } from "./projectSpecRegistry"

export function createMetadataItemProjectSchemaExporter(rule: MetadataItemRule): RegisteredProjectSpec["exportSchema"] {
  return createProjectSchemaExporter(({ context, name }) => exportMetadataItemToJSONSchema({ context, rule, name }))
}

export function createProjectSchemaExporter(
  exporter: (params: { context: ConfigurationContext; name?: string }) => TSchema
): RegisteredProjectSpec["exportSchema"] {
  return ({ context, mode = "externalRefs", name }) => {
    const schemaContext = createJSONSchemaExportContext(context, mode)
    const namedSchemaContext =
      name === undefined
        ? schemaContext
        : {
            ...schemaContext,
            exportToJSONSchema: {
              ...schemaContext.exportToJSONSchema!,
              currentItemName: name,
            },
          }
    const schema = exporter({ context: namedSchemaContext, name })

    return mode === "externalRefs" ? attachCollectedSchemaRefs(namedSchemaContext, schema) : schema
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
