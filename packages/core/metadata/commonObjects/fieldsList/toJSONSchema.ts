import { TSchema } from "typebox"
import { ExportToJSONSchemaFn, definePropertyTypeRule } from "../../ruleRuntime"
import { FieldsListJSONSchema } from "./types"

export const exportFieldsListToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return FieldsListJSONSchema
}

export const metadataPropertyRule000 = definePropertyTypeRule("FieldsList", "exportToJSONSchema", exportFieldsListToJSONSchema)
