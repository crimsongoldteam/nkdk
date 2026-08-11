import type { TSchema } from "typebox"
import type { ConfigurationContext } from "../context/types"
import { attachCollectedSchemaRefs, createJSONSchemaExportContext } from "../ruleRuntime/jsonSchemaRefs"
import { exportMetadataItemToJSONSchema } from "../ruleRuntime/metadataItem/toJSONSchema"
import type { MetadataItemRule } from "../ruleRuntime/property/types"
import type { RegisteredProjectSpec } from "./projectSpecContracts"

export function createMetadataItemProjectSchemaExporter(rule: MetadataItemRule): RegisteredProjectSpec["exportSchema"] {
  return createProjectSchemaExporter(({ context, execution }) =>
    exportMetadataItemToJSONSchema({ context, rule, execution }))
}

export function createProjectSchemaExporter(
  exporter: (params: {
    context: ConfigurationContext
    execution?: import("../ruleRuntime/property/fn").PropertyRuleExecution
  }) => TSchema
): RegisteredProjectSpec["exportSchema"] {
  return ({ context, mode = "externalRefs", execution }) => {
    const ownsContext = context.exportToJSONSchema === undefined
    const schemaContext = ownsContext
      ? createJSONSchemaExportContext(context, mode, { excludeImplicitValueYAML: true })
      : context
    const schema = exporter({ context: schemaContext, execution })

    return ownsContext && mode === "externalRefs"
      ? attachCollectedSchemaRefs(schemaContext, schema)
      : schema
  }
}
