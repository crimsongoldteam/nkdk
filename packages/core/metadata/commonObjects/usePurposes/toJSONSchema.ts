import { TSchema } from "@sinclair/typebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "~/metadata/orchestration"
import { UsePurposesJSONSchema } from "./types"

export const exportUsePurposesToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return UsePurposesJSONSchema
}

registerTypeRule("UsePurposes", "exportToJSONSchema", exportUsePurposesToJSONSchema)
