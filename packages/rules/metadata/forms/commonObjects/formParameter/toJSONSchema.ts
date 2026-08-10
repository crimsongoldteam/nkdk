import { TSchema } from "typebox"
import { ExportToJSONSchemaFn, definePropertyTypeRule } from "../../../ruleRuntime"
import { FormParameterJSONSchema, FormParametersJSONSchema } from "./types"

export const exportFormParameterToJSONSchema = (): TSchema => {
  return FormParameterJSONSchema
}

export const exportFormParametersToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return FormParametersJSONSchema
}

export const metadataPropertyRule000 = definePropertyTypeRule("FormParameters", "exportToJSONSchema", exportFormParametersToJSONSchema)
