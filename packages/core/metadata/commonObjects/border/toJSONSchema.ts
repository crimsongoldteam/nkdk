import { TSchema } from "@sinclair/typebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "~/metadata/metadataFactory"
import { BorderJSONSchema } from "./types"

export const exportBorderToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return BorderJSONSchema
}

registerTypeRule("Border", "exportToJSONSchema", exportBorderToJSONSchema)
