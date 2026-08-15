import { TSchema } from "typebox"
import { definePropertyTypeRule } from "../../ruleRuntime"
import { ExportToJSONSchemaFn } from "@nkdk/runtime/rule-kit"
import { FoldableI8nTextJSONSchema, I8nTextJSONSchema } from "./types"

export const exportI8nTextToJSONSchema: ExportToJSONSchemaFn = ({ rule }): TSchema => {
  return rule.excludeIfEqualNameYAML === true ? FoldableI8nTextJSONSchema : I8nTextJSONSchema
}

export const metadataPropertyRule000 = definePropertyTypeRule("I8nText", "exportToJSONSchema", exportI8nTextToJSONSchema)
