import { TSchema } from "@sinclair/typebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "~/metadata/orchestration"
import { StandardAttributeDescriptionsJSONSchema } from "./types"

export const exportStandardAttributeDescriptionToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return StandardAttributeDescriptionsJSONSchema
}

registerTypeRule("StandardAttributeDescription", "exportToJSONSchema", exportStandardAttributeDescriptionToJSONSchema)
