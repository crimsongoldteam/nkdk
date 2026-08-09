import { TSchema } from "typebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "../../ruleRuntime"
import { FormattedI8nTextJSONSchema } from "./types"

export const exportFormattedI8nTextToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return FormattedI8nTextJSONSchema
}

registerTypeRule("FormattedI8nText", "exportToJSONSchema", exportFormattedI8nTextToJSONSchema)
