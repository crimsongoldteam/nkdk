import { TSchema } from "typebox"
import { ExportToJSONSchemaFn, definePropertyTypeRule } from "../../../ruleRuntime"
import { CommandSetJSONSchema } from "./types"

export const exportCommandSetToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return CommandSetJSONSchema
}

export const metadataPropertyRule000 = definePropertyTypeRule("CommandSet", "exportToJSONSchema", exportCommandSetToJSONSchema)
