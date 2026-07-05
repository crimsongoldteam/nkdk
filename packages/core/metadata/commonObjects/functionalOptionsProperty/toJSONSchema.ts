import { TSchema } from "@sinclairtypebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "../../orchestration"
import { FunctionalOptionsPropertyJSONSchema } from "./types"

export const exportFunctionalOptionsPropertyToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return FunctionalOptionsPropertyJSONSchema
}

registerTypeRule("FunctionalOptionsProperty", "exportToJSONSchema", exportFunctionalOptionsPropertyToJSONSchema)
