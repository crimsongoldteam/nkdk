import { TSchema } from "typebox"
import { ExportToJSONSchemaFn, definePropertyTypeRule } from "../../ruleRuntime"
import { FoldableFormattedI8nTextJSONSchema, FormattedI8nTextJSONSchema } from "./types"

export const exportFormattedI8nTextToJSONSchema: ExportToJSONSchemaFn = ({ rule }): TSchema => {
  return rule.excludeIfEqualNameYAML === true
    ? FoldableFormattedI8nTextJSONSchema
    : FormattedI8nTextJSONSchema
}

export const metadataPropertyRule000 = definePropertyTypeRule("FormattedI8nText", "exportToJSONSchema", exportFormattedI8nTextToJSONSchema)
