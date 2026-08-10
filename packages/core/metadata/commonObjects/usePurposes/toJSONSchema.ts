import { TSchema } from "typebox"
import { ExportToJSONSchemaFn, definePropertyTypeRule } from "../../ruleRuntime"
import { UsePurposesJSONSchema } from "./types"

export const exportUsePurposesToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return UsePurposesJSONSchema
}

export const metadataPropertyRule000 = definePropertyTypeRule("UsePurposes", "exportToJSONSchema", exportUsePurposesToJSONSchema)
