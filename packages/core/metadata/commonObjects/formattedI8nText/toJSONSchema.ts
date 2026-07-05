import { TSchema } from "@sinclairtypebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "../../orchestration"
import { FormattedI8nTextJSONSchema } from "./types"

export const exportFormattedI8nTextToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return FormattedI8nTextJSONSchema
}

registerTypeRule("FormattedI8nText", "exportToJSONSchema", exportFormattedI8nTextToJSONSchema)
