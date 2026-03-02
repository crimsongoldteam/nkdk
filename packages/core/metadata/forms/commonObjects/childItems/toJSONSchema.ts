import { TSchema, Type } from "@sinclair/typebox"
import { ConfigurationContext } from "~/metadata/context/types"
import { ExportToJSONSchemaFn } from "~/metadata/metadataFactory"
import { exportElementToJSONSchema } from "~/metadata/metadataFactory/elements/toJSONSchema"
import { AllChildItem } from "./types"

export const exportChildItemsToJSONSchema: ExportToJSONSchemaFn = (params: {
  context: ConfigurationContext
  value: AllChildItem[] | undefined
}): TSchema | undefined => {
  const { context, value: items } = params

  if (!items || items.length === 0) return undefined

  const result = {} as TSchema
  for (const item of items) {
    const resultItem = exportElementToJSONSchema({
      context,
      itemType: item.itemType,
      value: item,
    })
    result[item.itemType] = Type.Optional(resultItem)
  }
  return Type.Object(result, { additionalProperties: false })
}

// registerTypeRule("ChildItems", "exportToJSONSchema", exportChildItemsToJSONSchema)
