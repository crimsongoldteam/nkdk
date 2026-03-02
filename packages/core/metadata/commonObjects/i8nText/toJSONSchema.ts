import { TSchema } from "@sinclair/typebox"
import { registerTypeRule } from "~/metadata/metadataFactory"
import { ExportToJSONSchemaFn } from "~/metadata/metadataFactory/types/types"
import { I8nTextJSONSchema } from "./types"

export const exportI8nTextToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return I8nTextJSONSchema
}

registerTypeRule("I8nText", "exportToJSONSchema", exportI8nTextToJSONSchema)
