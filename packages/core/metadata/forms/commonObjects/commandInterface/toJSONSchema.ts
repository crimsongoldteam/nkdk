import { TSchema } from "@sinclair/typebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "../../../orchestration"
import { CommandInterfaceJSONSchema } from "./types"
export const exportCommandInterfaceToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return CommandInterfaceJSONSchema
}

registerTypeRule("CommandInterface", "exportToJSONSchema", exportCommandInterfaceToJSONSchema)
