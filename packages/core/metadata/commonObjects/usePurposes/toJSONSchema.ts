import { TSchema } from "@sinclairtypebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "../../orchestration"
import { UsePurposesJSONSchema } from "./types"

export const exportUsePurposesToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return UsePurposesJSONSchema
}

registerTypeRule("UsePurposes", "exportToJSONSchema", exportUsePurposesToJSONSchema)
