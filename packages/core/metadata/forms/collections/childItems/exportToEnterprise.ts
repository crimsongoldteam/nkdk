import { ConfigurationContext } from "~/metadata/context/types"
import { getOperationFunction } from "~/metadata/metadataFactory/metadataFactory"
import { ChildItems, ChildItemsPartialEnterprise } from "./types"

export const exportTypedChildItemsToEnterprise = (
  context: ConfigurationContext,
  data: ChildItems | undefined
): ChildItemsPartialEnterprise | undefined => {
  if (!data || data.length === 0) return undefined

  const result: ChildItemsPartialEnterprise = {}
  for (const item of data) {
    const fn = getOperationFunction("ExportTypedToEnterprise", item.elementType)
    if (fn == undefined) throw new Error(`Export function not found for element type: ${item.elementType}`)
    const resultItem = fn(context, item)
    result[item.name] = resultItem
  }

  return result
}

export const exportPartialChildItemsToEnterprise = (
  context: ConfigurationContext,
  data: ChildItems | undefined
): ChildItemsPartialEnterprise | undefined => {
  if (!data || data.length === 0) return undefined

  const result: ChildItemsPartialEnterprise = {}
  for (const item of data) {
    const fn = getOperationFunction("ExportPartialToEnterprise", item.elementType)
    if (fn == undefined) throw new Error(`Export function not found for element type: ${item.elementType}`)
    const resultItem = fn(context, item)
    result[item.name] = resultItem
  }

  return result
}
