import { TSchema, Type } from "@sinclair/typebox"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportEventsToJSONSchema } from "../event/toJSONSchema"
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

  const events = exportEventsToJSONSchema({ rule })

  const result = Type.Object(
    {
      ...properties,
      ...events,
    },
    { additionalProperties: false }
  )

  return result
}
