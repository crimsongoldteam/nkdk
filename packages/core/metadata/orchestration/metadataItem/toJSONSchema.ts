import { TSchema, Type } from "@sinclair/typebox"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportPropertiesToJSONSchema } from "../property/toJSONSchema"
import { MetadataItem, MetadataItemRule } from "../property/types"

export const exportMetadataItemToJSONSchema = <T extends MetadataItem>(params: {
  context: ConfigurationContext
  rule: MetadataItemRule
  value?: T
}): TSchema => {
  const { context, rule, value } = params

  const properties = exportPropertiesToJSONSchema({
    context,
    metadataItem: value,
    rule,
  })

  const result = Type.Object(
    {
      ...properties,
    },
    { additionalProperties: false }
  )

  return result
}
