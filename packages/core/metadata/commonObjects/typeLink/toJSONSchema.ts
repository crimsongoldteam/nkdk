import { TSchema } from "@sinclair/typebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "~/metadata/metadataFactory"
import { TypeLinkJSONSchema } from "./types"

export const exportTypeLinkToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return TypeLinkJSONSchema
}

registerTypeRule("TypeLink", "exportToJSONSchema", exportTypeLinkToJSONSchema)
