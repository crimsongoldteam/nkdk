import { TSchema } from "typebox"
import { ExportToJSONSchemaFn, definePropertyTypeRule } from "../../ruleRuntime"
import { FontJSONSchema } from "./types"

export const exportFontToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return FontJSONSchema
}

export const metadataPropertyRule000 = definePropertyTypeRule("Font", "exportToJSONSchema", exportFontToJSONSchema)
