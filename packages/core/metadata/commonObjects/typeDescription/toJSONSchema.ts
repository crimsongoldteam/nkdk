import { TSchema } from "@sinclair/typebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "~/metadata/metadataFactory"
import { TypeDescriptionJSONSchema } from "./types"

export const exportTypeDescriptionToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return TypeDescriptionJSONSchema
}

registerTypeRule("TypeDescription", "exportToJSONSchema", exportTypeDescriptionToJSONSchema)
