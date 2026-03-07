import { TSchema } from "@sinclair/typebox"
import { registerTypeRule } from "~/metadata/orchestration"
import { ExportToJSONSchemaFn } from "~/metadata/orchestration/property/fn"
import { I8nTextJSONSchema } from "./types"

export const exportI8nTextToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return I8nTextJSONSchema
}

registerTypeRule("I8nText", "exportToJSONSchema", exportI8nTextToJSONSchema)
