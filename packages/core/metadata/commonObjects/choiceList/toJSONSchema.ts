import { TSchema } from "@sinclair/typebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "~/metadata/orchestration"
import { ChoiceListJSONSchema } from "./types"

export const exportChoiceListToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return ChoiceListJSONSchema
}

registerTypeRule("ChoiceList", "exportToJSONSchema", exportChoiceListToJSONSchema)
