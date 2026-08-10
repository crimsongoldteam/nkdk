import { TSchema } from "typebox"
import { ExportToJSONSchemaFn, definePropertyTypeRule } from "../../ruleRuntime"
import { ChoiceListJSONSchema } from "./types"

export const exportChoiceListToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return ChoiceListJSONSchema
}

export const metadataPropertyRule000 = definePropertyTypeRule("ChoiceList", "exportToJSONSchema", exportChoiceListToJSONSchema)
