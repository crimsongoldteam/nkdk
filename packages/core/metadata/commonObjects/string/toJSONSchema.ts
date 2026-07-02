import { TSchema } from "@sinclair/typebox"
import { buildMetadataTargetSchema } from "../metadataTargets"
import { ExportToJSONSchemaFn, registerTypeRule } from "../../orchestration"
import { StringJSONSchema } from "./types"

export const exportStringToJSONSchema: ExportToJSONSchemaFn = ({ rule }): TSchema => {
  if (rule.metadataTarget) return buildMetadataTargetSchema(rule.metadataTarget)
  return StringJSONSchema
}

registerTypeRule("string", "exportToJSONSchema", exportStringToJSONSchema)
