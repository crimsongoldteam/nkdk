import { TSchema } from "@sinclair/typebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "~/metadata/metadataFactory"
import { DataPathJSONSchema } from "./types"

export const exportDataPathToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return DataPathJSONSchema
}

registerTypeRule("DataPath", "exportToJSONSchema", exportDataPathToJSONSchema)
