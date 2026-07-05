import { TSchema } from "@sinclairtypebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "../../orchestration"
import { BooleanJSONSchema } from "./types"

export const exportBooleanToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return BooleanJSONSchema
}

registerTypeRule("boolean", "exportToJSONSchema", exportBooleanToJSONSchema)
