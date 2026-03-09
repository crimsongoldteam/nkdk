import { TSchema } from "@sinclair/typebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "~/metadata/orchestration"
import { FormParametersJSONSchema } from "./types"

export const exportFormParametersToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return FormParametersJSONSchema
}

registerTypeRule("FormParameters", "exportToJSONSchema", exportFormParametersToJSONSchema)
