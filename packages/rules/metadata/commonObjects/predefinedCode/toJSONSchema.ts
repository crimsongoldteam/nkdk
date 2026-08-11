import { TSchema } from "typebox"
import { ExportToJSONSchemaFn, definePropertyTypeRule } from "../../ruleRuntime"
import { PredefinedCodeJSONSchema } from "./types"

export const exportPredefinedCodeToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return PredefinedCodeJSONSchema
}

export const metadataPropertyRule000 = definePropertyTypeRule("PredefinedCode", "exportToJSONSchema", exportPredefinedCodeToJSONSchema)
