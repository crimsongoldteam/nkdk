import { TSchema } from "typebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "../../orchestration"
import { PredefinedCodeJSONSchema } from "./types"

export const exportPredefinedCodeToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return PredefinedCodeJSONSchema
}

registerTypeRule("PredefinedCode", "exportToJSONSchema", exportPredefinedCodeToJSONSchema)
