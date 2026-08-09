import { TSchema } from "typebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "../../ruleRuntime"
import { ChoiceParameterLinksJSONSchema } from "./types"

export const exportChoiceParameterLinksToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return ChoiceParameterLinksJSONSchema
}

registerTypeRule("ChoiceParameterLinks", "exportToJSONSchema", exportChoiceParameterLinksToJSONSchema)
