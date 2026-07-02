import { TSchema } from "@sinclair/typebox"
import { buildMetadataTargetSchema } from "../metadataTargets"
import { ExportToJSONSchemaFn, registerTypeRule } from "../../orchestration"
import { MetadataValueJSONSchema } from "./types"

export const exportMetadataValueToJSONSchema: ExportToJSONSchemaFn = ({ rule }): TSchema => {
  if (rule.metadataTarget) return buildMetadataTargetSchema(rule.metadataTarget)

  return MetadataValueJSONSchema
}

registerTypeRule("MetadataValue", "exportToJSONSchema", exportMetadataValueToJSONSchema)
