import type { TSchema } from "typebox"
import type { ConfigurationContext } from "@nkdk/runtime"
import { attachCollectedSchemaRefs, createJSONSchemaExportContext } from "../ruleRuntime/jsonSchemaRefs"
import { exportMetadataItemToJSONSchema } from "../ruleRuntime/metadataItem/toJSONSchema"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
import type { RegisteredProjectSpec } from "./projectSpecContracts"

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
