import { TSchema, Type } from "@sinclair/typebox"
import { ConfigurationContext } from "~/metadata/context/types"
import { ExportToJSONSchemaFn, registerTypeRule } from "~/metadata/orchestration"
import { exportMetadataItemToJSONSchema } from "~/metadata/orchestration/metadataItem/toJSONSchema"
import { StandardAttributeDescriptionRules } from "./rules"

export const exportStandardAttributeDescriptionToJSONSchema: ExportToJSONSchemaFn = (params: {
  context: ConfigurationContext
}): TSchema => {
  const { context } = params
  const attributeSchema = exportMetadataItemToJSONSchema({
    context: context,
    rule: StandardAttributeDescriptionRules,
  })
  return Type.Record(Type.String(), attributeSchema)
}

registerTypeRule("StandardAttributeDescriptions", "exportToJSONSchema", exportStandardAttributeDescriptionToJSONSchema)
