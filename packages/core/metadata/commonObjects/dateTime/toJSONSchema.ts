import { TSchema } from "typebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "../../ruleRuntime"
import { DateTimeJSONSchema } from "./types"

export const exportDateTimeToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return DateTimeJSONSchema
}

registerTypeRule("dateTime", "exportToJSONSchema", exportDateTimeToJSONSchema)
