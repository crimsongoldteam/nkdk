import { TSchema } from "@sinclair/typebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "../../orchestration"
import { ChoiceParametersJSONSchema } from "./types"

export const exportChoiceParametersToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return ChoiceParametersJSONSchema
}

registerTypeRule("ChoiceParameters", "exportToJSONSchema", exportChoiceParametersToJSONSchema)
