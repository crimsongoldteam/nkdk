import { TSchema } from "@sinclair/typebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "~/metadata/orchestration"
import { ChoiceParameterLinksJSONSchema } from "./types"

export const exportChoiceParameterLinksToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return ChoiceParameterLinksJSONSchema
}

registerTypeRule("ChoiceParameterLinks", "exportToJSONSchema", exportChoiceParameterLinksToJSONSchema)
