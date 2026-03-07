import { TSchema } from "@sinclair/typebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "~/metadata/orchestration"
import { MetadataItemLinksJSONSchema } from "./types"

export const exportMetadataItemLinksToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return MetadataItemLinksJSONSchema
}

registerTypeRule("MetadataItemLinks", "exportToJSONSchema", exportMetadataItemLinksToJSONSchema)
