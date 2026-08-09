import { TSchema } from "typebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "../../ruleRuntime"
import { FieldsListJSONSchema } from "./types"

export const exportFieldsListToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return FieldsListJSONSchema
}

registerTypeRule("FieldsList", "exportToJSONSchema", exportFieldsListToJSONSchema)
