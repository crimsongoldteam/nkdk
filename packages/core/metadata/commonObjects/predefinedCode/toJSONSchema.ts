import { TSchema } from "typebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "../../ruleRuntime"
import { PredefinedCodeJSONSchema } from "./types"

export const exportPredefinedCodeToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return PredefinedCodeJSONSchema
}

registerTypeRule("PredefinedCode", "exportToJSONSchema", exportPredefinedCodeToJSONSchema)
