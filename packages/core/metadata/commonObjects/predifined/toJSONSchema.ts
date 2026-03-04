import { TSchema } from "@sinclair/typebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "~/metadata/orchestration"
import { PredefinedItemsYAMLJSONSchema } from "./types"

export const exportPredefinedToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return PredefinedItemsYAMLJSONSchema
}

registerTypeRule("Predefined", "exportToJSONSchema", exportPredefinedToJSONSchema)
