import { TSchema, Type } from "@sinclair/typebox"
import { ConfigurationContext } from "../../context/types"
import { ExportToJSONSchemaFn, registerTypeRule } from "../../orchestration"
import { exportMetadataItemToJSONSchema } from "../../orchestration/metadataItem/toJSONSchema"
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
