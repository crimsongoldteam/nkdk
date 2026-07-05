import { TSchema } from "typebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "../../../orchestration"
import { FormParametersJSONSchema } from "./types"

export const exportFormParametersToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return FormParametersJSONSchema
}

registerTypeRule("FormParameters", "exportToJSONSchema", exportFormParametersToJSONSchema)
