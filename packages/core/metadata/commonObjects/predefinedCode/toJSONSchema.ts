import { TSchema } from "@sinclairtypebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "../../orchestration"
import { PredefinedCodeJSONSchema } from "./types"

export const exportPredefinedCodeToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return PredefinedCodeJSONSchema
}

registerTypeRule("PredefinedCode", "exportToJSONSchema", exportPredefinedCodeToJSONSchema)
