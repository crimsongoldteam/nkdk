import { ConfigurationContext } from "~/metadata/context/types"
import { registerTypeRule, ToEnterprise } from "~/metadata/metadataFactory"
import { exportElementToEnterprise } from "~/metadata/orchestration/formElement/toEnterprise"
import { AllChildItem } from "./types"

export const exportChildItemsToEnterprise = <From extends AllChildItem>(params: {
  context: ConfigurationContext
  value: From[] | undefined
}): ToEnterprise<From>[] | undefined => {
  const { context, value: items } = params

  if (!items || items.length === 0) return []

  const result = [] as ToEnterprise<From>[]
  for (const item of items) {
    const resultItem = exportElementToEnterprise({ context, itemType: item.itemType, value: item })
    result.push(resultItem)
  }
  return result
}

registerTypeRule("ChildItems", "exportToEnterprise", exportChildItemsToEnterprise)
