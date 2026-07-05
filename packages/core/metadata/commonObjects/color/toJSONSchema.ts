import { TSchema } from "@sinclairtypebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "../../orchestration"
import { ColorJSONSchema } from "./types"

export const exportColorToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return ColorJSONSchema
}

registerTypeRule("Color", "exportToJSONSchema", exportColorToJSONSchema)
