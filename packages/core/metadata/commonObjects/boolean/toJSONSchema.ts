import { TSchema } from "@sinclair/typebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "~/metadata/metadataFactory"
import { BooleanJSONSchema } from "./types"

export const exportBooleanToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return BooleanJSONSchema
}

registerTypeRule("boolean", "exportToJSONSchema", exportBooleanToJSONSchema)
