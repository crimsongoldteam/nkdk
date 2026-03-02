import { TSchema } from "@sinclair/typebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "~/metadata/metadataFactory"
import { MetadataAttributesJSONSchema } from "./types"

export const exportMetadataAttributesToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return MetadataAttributesJSONSchema
}

registerTypeRule("MetadataAttributes", "exportToJSONSchema", exportMetadataAttributesToJSONSchema)
