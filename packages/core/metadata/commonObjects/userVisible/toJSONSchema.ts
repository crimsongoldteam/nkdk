import { TSchema } from "@sinclair/typebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "~/metadata/metadataFactory"
import { UserVisibleJSONSchema } from "./types"

export const exportUserVisibleToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return UserVisibleJSONSchema
}

registerTypeRule("UserVisible", "exportToJSONSchema", exportUserVisibleToJSONSchema)
