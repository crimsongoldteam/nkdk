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
    const exportFunction = getOperationFunction("ExportTypedToEnterprise", item.elementType)
    if (!exportFunction) throw new Error(`Export function not found for element type: ${item.elementType}`)
    const value = exportFunction(context, item)
    result[item.name] = value
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
    const exportFunction = getOperationFunction("ExportPartialToEnterprise", item.elementType)
    if (!exportFunction) throw new Error(`Export function not found for element type: ${item.elementType}`)
    const value = exportFunction(context, item)
    result[item.name] = value
  }

  return result
}
