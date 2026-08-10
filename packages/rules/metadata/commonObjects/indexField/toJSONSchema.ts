import { TSchema, Type } from "typebox"
import { ExportToJSONSchemaFn, definePropertyTypeRule } from "../../ruleRuntime"
import { IndexFieldJSONSchema } from "./types"

export const exportIndexFieldToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return Type.Array(IndexFieldJSONSchema)
}

export const metadataPropertyRule000 = definePropertyTypeRule("IndexField", "exportToJSONSchema", exportIndexFieldToJSONSchema)
