import { TSchema } from "@sinclair/typebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "~/metadata/metadataFactory"
import { FunctionalOptionsPropertyJSONSchema } from "./types"

export const exportFunctionalOptionsPropertyToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return FunctionalOptionsPropertyJSONSchema
}

registerTypeRule("FunctionalOptionsProperty", "exportToJSONSchema", exportFunctionalOptionsPropertyToJSONSchema)
