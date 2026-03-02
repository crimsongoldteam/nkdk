import { TSchema } from "@sinclair/typebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "~/metadata/metadataFactory"
import { PictureJSONSchema } from "./types"

export const exportPictureToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return PictureJSONSchema
}

registerTypeRule("Picture", "exportToJSONSchema", exportPictureToJSONSchema)
