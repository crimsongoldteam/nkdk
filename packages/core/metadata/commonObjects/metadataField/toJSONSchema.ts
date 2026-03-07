import { TSchema, Type } from "@sinclair/typebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "~/metadata/orchestration"
import { MetadataFieldJSONSchema } from "./types"

export const exportMetadataFieldToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return MetadataFieldJSONSchema
}

export const exportMetadataFieldsToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return Type.Array(MetadataFieldJSONSchema)
}

registerTypeRule("MetadataField", "exportToJSONSchema", exportMetadataFieldToJSONSchema)
registerTypeRule("MetadataFields", "exportToJSONSchema", exportMetadataFieldsToJSONSchema)
