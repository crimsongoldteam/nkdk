import { TSchema } from "typebox"
import { ExportToJSONSchemaFn, definePropertyTypeRule } from "../../ruleRuntime"
import { DateTimeJSONSchema } from "./types"

export const exportDateTimeToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return DateTimeJSONSchema
}

export const metadataPropertyRule000 = definePropertyTypeRule("dateTime", "exportToJSONSchema", exportDateTimeToJSONSchema)
