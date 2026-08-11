import { TSchema } from "typebox"
import { ExportToJSONSchemaFn, definePropertyTypeRule } from "../../ruleRuntime"
import { StringOrNumberJSONSchema } from "./types"

export const exportStringOrNumberToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return StringOrNumberJSONSchema
}

export const metadataPropertyRule000 = definePropertyTypeRule("StringOrNumber", "exportToJSONSchema", exportStringOrNumberToJSONSchema)
