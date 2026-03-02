import { TSchema } from "@sinclair/typebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "~/metadata/metadataFactory"
import { AdditionalIndexJSONSchema } from "./types"

export const exportAdditionalIndexToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return AdditionalIndexJSONSchema
}

registerTypeRule("AdditionalIndex", "exportToJSONSchema", exportAdditionalIndexToJSONSchema)
