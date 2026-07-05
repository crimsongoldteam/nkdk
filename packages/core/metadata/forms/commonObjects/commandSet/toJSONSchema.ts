import { TSchema } from "typebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "../../../orchestration"
import { CommandSetJSONSchema } from "./types"

export const exportCommandSetToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return CommandSetJSONSchema
}

registerTypeRule("CommandSet", "exportToJSONSchema", exportCommandSetToJSONSchema)
