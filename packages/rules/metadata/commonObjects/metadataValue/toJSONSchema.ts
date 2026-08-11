import { TSchema } from "typebox"
import { buildMetadataTargetSchema } from "../metadataTargets"
import { ExportToJSONSchemaFn, definePropertyTypeRule } from "../../ruleRuntime"
import { MetadataValueJSONSchema } from "./types"

export const exportMetadataValueToJSONSchema: ExportToJSONSchemaFn = ({ rule }): TSchema => {
  if (rule.metadataTarget) return buildMetadataTargetSchema(rule.metadataTarget)

  return MetadataValueJSONSchema
}

export const metadataPropertyRule000 = definePropertyTypeRule("MetadataValue", "exportToJSONSchema", exportMetadataValueToJSONSchema)
