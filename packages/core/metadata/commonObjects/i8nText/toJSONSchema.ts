import { TSchema } from "typebox"
import { definePropertyTypeRule } from "../../ruleRuntime"
import { ExportToJSONSchemaFn } from "../../ruleRuntime/property/fn"
import { I8nTextJSONSchema } from "./types"

export const exportI8nTextToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return I8nTextJSONSchema
}

export const metadataPropertyRule000 = definePropertyTypeRule("I8nText", "exportToJSONSchema", exportI8nTextToJSONSchema)
