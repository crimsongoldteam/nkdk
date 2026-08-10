import { TSchema } from "typebox"
import { ExportToJSONSchemaFn, definePropertyTypeRule } from "../../ruleRuntime"
import { ColorJSONSchema } from "./types"

export const exportColorToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return ColorJSONSchema
}

export const metadataPropertyRule000 = definePropertyTypeRule("Color", "exportToJSONSchema", exportColorToJSONSchema)
