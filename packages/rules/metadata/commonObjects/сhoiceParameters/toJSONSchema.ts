import { TSchema } from "typebox"
import { ExportToJSONSchemaFn, definePropertyTypeRule } from "../../ruleRuntime"
import { ChoiceParametersJSONSchema } from "./types"

export const exportChoiceParametersToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return ChoiceParametersJSONSchema
}

export const metadataPropertyRule000 = definePropertyTypeRule("ChoiceParameters", "exportToJSONSchema", exportChoiceParametersToJSONSchema)
