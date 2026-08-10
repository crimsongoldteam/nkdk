import { TSchema } from "typebox"
import { ExportToJSONSchemaFn, definePropertyTypeRule } from "../../ruleRuntime"
import { FunctionalOptionsPropertyJSONSchema } from "./types"

export const exportFunctionalOptionsPropertyToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return FunctionalOptionsPropertyJSONSchema
}

export const metadataPropertyRule000 = definePropertyTypeRule("FunctionalOptionsProperty", "exportToJSONSchema", exportFunctionalOptionsPropertyToJSONSchema)
