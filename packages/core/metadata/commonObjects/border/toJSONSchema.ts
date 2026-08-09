import { TSchema } from "typebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "../../ruleRuntime"
import { BorderJSONSchema } from "./types"

export const exportBorderToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return BorderJSONSchema
}

registerTypeRule("Border", "exportToJSONSchema", exportBorderToJSONSchema)
