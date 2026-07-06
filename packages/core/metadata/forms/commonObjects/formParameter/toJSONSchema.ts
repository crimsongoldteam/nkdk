import { TSchema } from "typebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "../../../orchestration"
import { FormParameterJSONSchema, FormParametersJSONSchema } from "./types"

export const exportFormParameterToJSONSchema = (): TSchema => {
  return FormParameterJSONSchema
}

export const exportFormParametersToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return FormParametersJSONSchema
}

registerTypeRule("FormParameters", "exportToJSONSchema", exportFormParametersToJSONSchema)
