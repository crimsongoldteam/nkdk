import { TSchema } from "@sinclair/typebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "~/metadata/orchestration"
import { PictureJSONSchema } from "./types"

export const exportPictureToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return PictureJSONSchema
}

registerTypeRule("Picture", "exportToJSONSchema", exportPictureToJSONSchema)
