import { TSchema } from "@sinclair/typebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "~/metadata/orchestration"
import { TypeDescriptionJSONSchema } from "./types"

export const exportTypeDescriptionToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return TypeDescriptionJSONSchema
}

registerTypeRule("TypeDescription", "exportToJSONSchema", exportTypeDescriptionToJSONSchema)
