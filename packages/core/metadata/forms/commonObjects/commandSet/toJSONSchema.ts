import { TSchema } from "@sinclair/typebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "~/metadata/orchestration"
import { CommandSetJSONSchema } from "./types"

export const exportCommandSetToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return CommandSetJSONSchema
}

registerTypeRule("CommandSet", "exportToJSONSchema", exportCommandSetToJSONSchema)
