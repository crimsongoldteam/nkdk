import { TSchema } from "@sinclairtypebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "../../orchestration"
import { ChoiceListJSONSchema } from "./types"

export const exportChoiceListToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return ChoiceListJSONSchema
}

registerTypeRule("ChoiceList", "exportToJSONSchema", exportChoiceListToJSONSchema)
