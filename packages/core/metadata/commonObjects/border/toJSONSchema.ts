import { TSchema } from "@sinclairtypebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "../../orchestration"
import { BorderJSONSchema } from "./types"

export const exportBorderToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return BorderJSONSchema
}

registerTypeRule("Border", "exportToJSONSchema", exportBorderToJSONSchema)
