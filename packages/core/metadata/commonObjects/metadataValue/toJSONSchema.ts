import { TSchema } from "@sinclair/typebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "~/metadata/orchestration"
import { MetadataValueJSONSchema } from "./types"

export const exportMetadataValueToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return MetadataValueJSONSchema
}

registerTypeRule("MetadataValue", "exportToJSONSchema", exportMetadataValueToJSONSchema)
