import { TSchema } from "typebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "../../ruleRuntime"
import { UsePurposesJSONSchema } from "./types"

export const exportUsePurposesToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return UsePurposesJSONSchema
}

registerTypeRule("UsePurposes", "exportToJSONSchema", exportUsePurposesToJSONSchema)
