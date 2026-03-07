import { TSchema } from "@sinclair/typebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "~/metadata/orchestration"
import { MetadataValueCollectionJSONSchema } from "./types"

export const exportMetadataValueCollectionToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return MetadataValueCollectionJSONSchema
}

registerTypeRule("MetadataValueCollection", "exportToJSONSchema", exportMetadataValueCollectionToJSONSchema)
