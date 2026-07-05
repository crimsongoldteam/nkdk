import { TSchema } from "@sinclairtypebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "../../../orchestration"
import { FormParametersJSONSchema } from "./types"

export const exportFormParametersToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return FormParametersJSONSchema
}

registerTypeRule("FormParameters", "exportToJSONSchema", exportFormParametersToJSONSchema)
