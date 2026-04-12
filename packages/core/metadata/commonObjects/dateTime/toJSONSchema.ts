import { TSchema } from "@sinclair/typebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "~/metadata/orchestration"
import { DateTimeJSONSchema } from "./types"

export const exportDateTimeToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return DateTimeJSONSchema
}

registerTypeRule("dateTime", "exportToJSONSchema", exportDateTimeToJSONSchema)
