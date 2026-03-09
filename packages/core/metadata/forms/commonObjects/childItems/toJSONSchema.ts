import { TSchema, Type } from "@sinclair/typebox"
import { ConfigurationContext } from "~/metadata/context/types"
import { ExportToJSONSchemaFn, registerTypeRule } from "~/metadata/orchestration"
import { exportElementToJSONSchema } from "~/metadata/orchestration/formElement/toJSONSchema"
import { ChildItem } from "./types"

export const exportChildItemsToJSONSchema: ExportToJSONSchemaFn = (params: {
  context: ConfigurationContext
  value: ChildItem[] | undefined
}): TSchema | undefined => {
  const { context, value: items } = params

  if (!items || items.length === 0) return undefined

  const result = {} as TSchema
  for (const item of items) {
    const resultItem = exportElementToJSONSchema({
      context,
      value: item,
    })

    result[item.name] = Type.Optional(resultItem)

    if ("childItems" in item && item.childItems !== undefined && Array.isArray(item.childItems)) {
      for (const childItem of item.childItems) {
        const resultChildItem = exportElementToJSONSchema({
          context,
          value: childItem,
        })
        if (resultChildItem !== undefined) {
          result[childItem.name] = Type.Optional(resultChildItem)
        }
      }
    }
  }
  return Type.Object(result, { additionalProperties: false })
}

registerTypeRule("GroupChildItems", "exportToJSONSchema", exportChildItemsToJSONSchema)
registerTypeRule("CommandBarChildItems", "exportToJSONSchema", exportChildItemsToJSONSchema)
registerTypeRule("TableChildItems", "exportToJSONSchema", exportChildItemsToJSONSchema)
registerTypeRule("PagesChildItems", "exportToJSONSchema", exportChildItemsToJSONSchema)
