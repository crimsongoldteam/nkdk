import { TSchema } from "@sinclair/typebox"
import { buildMetadataTargetSchema } from "~/metadata/commonObjects/metadataTargets"
import { ExportToJSONSchemaFn, registerTypeRule } from "~/metadata/orchestration"
import { StringJSONSchema } from "./types"

export const exportStringToJSONSchema: ExportToJSONSchemaFn = ({ rule }): TSchema => {
  if (rule.metadataTarget) return buildMetadataTargetSchema(rule.metadataTarget)
  return StringJSONSchema
}

registerTypeRule("string", "exportToJSONSchema", exportStringToJSONSchema)
