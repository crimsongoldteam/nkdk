import { ConfigurationContext } from "~/metadata/context/types"
import { MetadataItemTypeToEnterprise, registerTypeRule } from "~/metadata/orchestration"
import { exportElementToEnterprise } from "~/metadata/orchestration/formElement/toEnterprise"
import { ChildItem } from "./types"

export const exportChildItemsToEnterprise = <From extends ChildItem>(params: {
  context: ConfigurationContext
  value: From[] | undefined
}): MetadataItemTypeToEnterprise<From["itemType"]>[] | undefined => {
  const { context, value: items } = params

  if (!items || items.length === 0) return []

  const result = [] as MetadataItemTypeToEnterprise<From["itemType"]>[]
  for (const item of items) {
    const resultItem = exportElementToEnterprise({ context, value: item })
    result.push(resultItem)
  }
  return result
}

registerTypeRule("GroupChildItems", "exportToEnterprise", exportChildItemsToEnterprise)
registerTypeRule("CommandBarChildItems", "exportToEnterprise", exportChildItemsToEnterprise)
registerTypeRule("TableChildItems", "exportToEnterprise", exportChildItemsToEnterprise)
registerTypeRule("PagesChildItems", "exportToEnterprise", exportChildItemsToEnterprise)
