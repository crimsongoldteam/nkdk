import { TSchema } from "typebox"
import { ExportToJSONSchemaFn, definePropertyTypeRule } from "../../ruleRuntime"
import { FormattedI8nTextJSONSchema } from "./types"

export const exportFormattedI8nTextToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return FormattedI8nTextJSONSchema
}

export const metadataPropertyRule000 = definePropertyTypeRule("FormattedI8nText", "exportToJSONSchema", exportFormattedI8nTextToJSONSchema)
