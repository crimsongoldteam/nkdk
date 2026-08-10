import { TSchema } from "typebox"
import { ExportToJSONSchemaFn, definePropertyTypeRule } from "../../ruleRuntime"
import { BorderJSONSchema } from "./types"

export const exportBorderToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return BorderJSONSchema
}

export const metadataPropertyRule000 = definePropertyTypeRule("Border", "exportToJSONSchema", exportBorderToJSONSchema)
