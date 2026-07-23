import type { TSchema } from "typebox"
import type { ConfigurationContext } from "../context/types"
import { attachCollectedSchemaRefs, createJSONSchemaExportContext } from "../orchestration/jsonSchemaRefs"
import { exportMetadataItemToJSONSchema } from "../orchestration/metadataItem/toJSONSchema"
import type { MetadataItemRule } from "../orchestration/property/types"
import type { RegisteredProjectSpec } from "./projectSpecRegistry"

export function createMetadataItemProjectSchemaExporter(rule: MetadataItemRule): RegisteredProjectSpec["exportSchema"] {
  return createProjectSchemaExporter(({ context }) => exportMetadataItemToJSONSchema({ context, rule }))
}

export function createProjectSchemaExporter(
  exporter: (params: { context: ConfigurationContext }) => TSchema
): RegisteredProjectSpec["exportSchema"] {
  return ({ context, mode = "externalRefs" }) => {
    const schemaContext = createJSONSchemaExportContext(context, mode, { excludeImplicitValueYAML: true })
    const schema = exporter({ context: schemaContext })

    return mode === "externalRefs" ? attachCollectedSchemaRefs(schemaContext, schema) : schema
  }
}
