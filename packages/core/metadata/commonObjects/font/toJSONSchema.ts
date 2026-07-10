import { TSchema } from "typebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "../../orchestration"
import { FontJSONSchema } from "./types"

export const exportFontToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return FontJSONSchema
}

registerTypeRule("Font", "exportToJSONSchema", exportFontToJSONSchema)
