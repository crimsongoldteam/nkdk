import { TSchema } from "@sinclair/typebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "~/metadata/orchestration"
import { DataPathJSONSchema } from "./types"

export const exportDataPathToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return DataPathJSONSchema
}

registerTypeRule("DataPath", "exportToJSONSchema", exportDataPathToJSONSchema)
