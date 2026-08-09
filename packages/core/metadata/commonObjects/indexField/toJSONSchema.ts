import { TSchema, Type } from "typebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "../../ruleRuntime"
import { IndexFieldJSONSchema } from "./types"

export const exportIndexFieldToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return Type.Array(IndexFieldJSONSchema)
}

registerTypeRule("IndexField", "exportToJSONSchema", exportIndexFieldToJSONSchema)
