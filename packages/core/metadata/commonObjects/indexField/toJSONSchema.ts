import { TSchema, Type } from "@sinclair/typebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "~/metadata/orchestration"
import { IndexFieldJSONSchema } from "./types"

export const exportIndexFieldToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return Type.Array(IndexFieldJSONSchema)
}

registerTypeRule("IndexField", "exportToJSONSchema", exportIndexFieldToJSONSchema)
