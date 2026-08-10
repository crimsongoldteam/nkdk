import { TSchema } from "typebox"
import { ExportToJSONSchemaFn, definePropertyTypeRule } from "../../ruleRuntime"
import { PictureJSONSchema } from "./types"

export const exportPictureToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return PictureJSONSchema
}

export const metadataPropertyRule000 = definePropertyTypeRule("Picture", "exportToJSONSchema", exportPictureToJSONSchema)
