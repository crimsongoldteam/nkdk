import { TSchema } from "@sinclairtypebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "../../orchestration"
import { FieldsListJSONSchema } from "./types"

export const exportFieldsListToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return FieldsListJSONSchema
}

registerTypeRule("FieldsList", "exportToJSONSchema", exportFieldsListToJSONSchema)
