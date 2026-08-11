import { TSchema } from "typebox"
import { ExportToJSONSchemaFn, definePropertyTypeRule } from "../../ruleRuntime"
import { UserVisibleJSONSchema } from "./types"

export const exportUserVisibleToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return UserVisibleJSONSchema
}

export const metadataPropertyRule000 = definePropertyTypeRule("UserVisible", "exportToJSONSchema", exportUserVisibleToJSONSchema)
