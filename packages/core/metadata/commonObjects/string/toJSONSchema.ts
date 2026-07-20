import { TSchema } from "typebox"
import { buildMetadataTargetSchema } from "../metadataTargets"
import { ExportToJSONSchemaFn, registerTypeRule } from "../../orchestration"
import { StringJSONSchema } from "./types"

export const exportStringToJSONSchema: ExportToJSONSchemaFn = ({ rule }): TSchema => {
  if (rule.metadataTarget) return buildMetadataTargetSchema(rule.metadataTarget)
  return StringJSONSchema
}

registerTypeRule("string", "exportToJSONSchema", exportStringToJSONSchema)
registerTypeRule("string", "validationSchemaRef", ({ rule }) => {
  if (rule.metadataTarget !== undefined) return undefined
  return rule.implicitValueYAML === "" ? "string/without-empty" : "string/base"
})
