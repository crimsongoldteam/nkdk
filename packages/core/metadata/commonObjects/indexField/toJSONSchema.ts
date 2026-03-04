import { TSchema } from "@sinclair/typebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "~/metadata/orchestration"
import { IndexFieldJSONSchema } from "./types"

export const exportIndexFieldToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return IndexFieldJSONSchema
}

registerTypeRule("IndexField", "exportToJSONSchema", exportIndexFieldToJSONSchema)
