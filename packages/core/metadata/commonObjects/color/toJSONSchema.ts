import { TSchema } from "@sinclair/typebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "~/metadata/metadataFactory"
import { ColorJSONSchema } from "./types"

export const exportColorToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return ColorJSONSchema
}

registerTypeRule("Color", "exportToJSONSchema", exportColorToJSONSchema)
