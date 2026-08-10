import { TSchema } from "typebox"
import { buildMetadataTargetSchema } from "../metadataTargets"
import { ExportToJSONSchemaFn, definePropertyTypeRule } from "../../ruleRuntime"
import { StringJSONSchema } from "./types"

export const exportStringToJSONSchema: ExportToJSONSchemaFn = ({ rule }): TSchema => {
  if (rule.metadataTarget) return buildMetadataTargetSchema(rule.metadataTarget)
  return StringJSONSchema
}

export const metadataPropertyRule000 = definePropertyTypeRule("string", "exportToJSONSchema", exportStringToJSONSchema)
export const metadataPropertyRule001 = definePropertyTypeRule("string", "validationSchemaRef", ({ rule }) => {
  if (rule.metadataTarget !== undefined) return undefined
  return rule.implicitValueYAML === "" ? "string/without-empty" : "string/base"
})
