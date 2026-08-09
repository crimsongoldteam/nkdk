import { TSchema } from "typebox"
import { registerTypeRule } from "../../ruleRuntime"
import { ExportToJSONSchemaFn } from "../../ruleRuntime/property/fn"
import { I8nTextJSONSchema } from "./types"

export const exportI8nTextToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return I8nTextJSONSchema
}

registerTypeRule("I8nText", "exportToJSONSchema", exportI8nTextToJSONSchema)
