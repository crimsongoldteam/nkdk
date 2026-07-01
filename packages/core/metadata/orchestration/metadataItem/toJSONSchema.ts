import { TSchema, Type } from "@sinclair/typebox"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportPropertiesToJSONSchema, exportPropertyToJSONSchema } from "../property/toJSONSchema"
import { MetadataItem, MetadataItemRule } from "../property/types"
import { findInlineProperty } from "./yamlInline"

export const exportMetadataItemToJSONSchema = <T extends MetadataItem>(params: {
  context: ConfigurationContext
  rule: MetadataItemRule
  value?: T
  name?: string
}): TSchema => {
  const { context, rule, value, name } = params

  const properties = exportPropertiesToJSONSchema({
    context,
    metadataItem: value,
    rule,
    name,
  })

  const objectSchema = Type.Object(
    {
      ...properties,
    },
    { additionalProperties: false }
  )

  const inline = findInlineProperty(rule)
  if (inline) {
    const inlineSchema = exportPropertyToJSONSchema({ context, rule: inline.prop, value: undefined, name })
    if (inlineSchema !== undefined) return inlineSchema
  }

  return objectSchema
}
