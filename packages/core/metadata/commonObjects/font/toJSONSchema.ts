import { TSchema } from "@sinclair/typebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "~/metadata/orchestration"
import { FontJSONSchema } from "./types"

export const exportFontToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return FontJSONSchema
}

registerTypeRule("Font", "exportToJSONSchema", exportFontToJSONSchema)
