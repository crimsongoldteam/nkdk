import { TSchema } from "@sinclairtypebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "../../orchestration"
import { ChoiceParameterLinksJSONSchema } from "./types"

export const exportChoiceParameterLinksToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return ChoiceParameterLinksJSONSchema
}

registerTypeRule("ChoiceParameterLinks", "exportToJSONSchema", exportChoiceParameterLinksToJSONSchema)
