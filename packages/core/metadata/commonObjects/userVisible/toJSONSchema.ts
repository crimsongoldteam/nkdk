import { TSchema } from "@sinclairtypebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "../../orchestration"
import { UserVisibleJSONSchema } from "./types"

export const exportUserVisibleToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return UserVisibleJSONSchema
}

registerTypeRule("UserVisible", "exportToJSONSchema", exportUserVisibleToJSONSchema)
