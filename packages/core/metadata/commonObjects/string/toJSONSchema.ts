import { TSchema } from "@sinclair/typebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "~/metadata/metadataFactory"
import { StringJSONSchema } from "./types"

export const exportStringToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return StringJSONSchema
}

registerTypeRule("string", "exportToJSONSchema", exportStringToJSONSchema)
