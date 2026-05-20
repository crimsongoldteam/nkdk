import { TSchema } from "@sinclair/typebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "~/metadata/orchestration"
import { PredefinedCodeJSONSchema } from "./types"

export const exportPredefinedCodeToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return PredefinedCodeJSONSchema
}

registerTypeRule("PredefinedCode", "exportToJSONSchema", exportPredefinedCodeToJSONSchema)
