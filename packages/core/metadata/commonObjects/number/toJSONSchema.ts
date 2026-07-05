import { TSchema } from "typebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "../../orchestration"
import { NumberJSONSchema } from "./types"

export const exportNumberToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return NumberJSONSchema
}

registerTypeRule("number", "exportToJSONSchema", exportNumberToJSONSchema)
