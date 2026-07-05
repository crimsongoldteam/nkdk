import { TSchema } from "typebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "../../orchestration"
import { DateTimeJSONSchema } from "./types"

export const exportDateTimeToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return DateTimeJSONSchema
}

registerTypeRule("dateTime", "exportToJSONSchema", exportDateTimeToJSONSchema)
