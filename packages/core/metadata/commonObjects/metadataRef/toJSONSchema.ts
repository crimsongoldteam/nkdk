import { TSchema } from "@sinclair/typebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "~/metadata/orchestration"
import { MetadataItemLinkJSONSchema, MetadataItemLinksJSONSchema } from "./types"

export const exportMetadataItemLinkToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return MetadataItemLinkJSONSchema
}

export const exportMetadataItemLinksToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return MetadataItemLinksJSONSchema
}

registerTypeRule("MetadataItemLink", "exportToJSONSchema", exportMetadataItemLinkToJSONSchema)
registerTypeRule("MetadataItemLinks", "exportToJSONSchema", exportMetadataItemLinksToJSONSchema)
