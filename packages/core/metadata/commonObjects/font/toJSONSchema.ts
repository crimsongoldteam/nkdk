import { TSchema } from "@sinclair/typebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "~/metadata/metadataFactory"
import { FontJSONSchema } from "./types"

export const exportFontToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return FontJSONSchema
}

registerTypeRule("Font", "exportToJSONSchema", exportFontToJSONSchema)
