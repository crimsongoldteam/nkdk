import { TSchema } from "@sinclair/typebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "~/metadata/orchestration"
import { MetadataFieldJSONSchema } from "./types"

export const exportMetadataFieldToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return MetadataFieldJSONSchema
}

registerTypeRule("MetadataField", "exportToJSONSchema", exportMetadataFieldToJSONSchema)
