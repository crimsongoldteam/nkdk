import { TSchema } from "typebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "../../orchestration"
import { StringOrNumberJSONSchema } from "./types"

export const exportStringOrNumberToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return StringOrNumberJSONSchema
}

registerTypeRule("StringOrNumber", "exportToJSONSchema", exportStringOrNumberToJSONSchema)
