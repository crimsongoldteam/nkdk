import { TSchema } from "typebox"
import { ExportToJSONSchemaFn, definePropertyTypeRule } from "../../../ruleRuntime"
import { CommandInterfaceJSONSchema } from "./types"
export const exportCommandInterfaceToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return CommandInterfaceJSONSchema
}

export const metadataPropertyRule000 = definePropertyTypeRule("CommandInterface", "exportToJSONSchema", exportCommandInterfaceToJSONSchema)
