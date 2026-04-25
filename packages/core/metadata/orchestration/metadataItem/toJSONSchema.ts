import { TSchema, Type } from "@sinclair/typebox"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportPropertiesToJSONSchema, exportPropertyToJSONSchema } from "../property/toJSONSchema"
import { MetadataItem, MetadataItemRule } from "../property/types"

export const exportMetadataItemToJSONSchema = <T extends MetadataItem>(params: {
  context: ConfigurationContext
  rule: MetadataItemRule
  value?: T
}): TSchema => {
  const { context, rule, value } = params

  const inlineEntries = Object.entries(rule.properties).filter(
    ([, p]) => (p as any).yamlInline === true && (p as any).forReferenceOnly !== true
  )
  if (inlineEntries.length > 1) {
    throw new Error(
      `Rule "${rule.itemType}": yamlInline=true должно быть установлено максимум для одного свойства, найдено ${inlineEntries.length}`
    )
  }
  if (inlineEntries.length === 1) {
    const [, prop] = inlineEntries[0]
    const inlineSchema = exportPropertyToJSONSchema({ context, rule: prop, value: undefined })
    if (inlineSchema !== undefined) return inlineSchema
  }

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
