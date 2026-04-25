import { TSchema, Type } from "@sinclair/typebox"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportPropertiesToJSONSchema, exportPropertyToJSONSchema } from "../property/toJSONSchema"
import { MetadataItem, MetadataItemRule } from "../property/types"
import { findInlineProperty } from "./yamlInline"

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

  const objectSchema = Type.Object(
    {
      ...properties,
    },
    { additionalProperties: false }
  )

  const inline = findInlineProperty(rule)
  if (inline) {
    const inlineSchema = exportPropertyToJSONSchema({ context, rule: inline.prop, value: undefined })
    if (inlineSchema !== undefined) return inlineSchema
  }

  return objectSchema
}
