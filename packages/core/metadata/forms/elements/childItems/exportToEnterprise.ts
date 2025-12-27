import { Context } from "~/packages/core/metadata/context/types"
import { getOperationFunction } from "~/packages/core/metadata/metadataFactory/metadataFactory"
import { ChildItems, ChildItemsEnterprise } from "./types"

export const exportChildItemsToEnterprise = (
  context: Context,
  data: ChildItems | undefined
): ChildItemsEnterprise | undefined => {
  if (!data || data.length === 0) return undefined

  const result: ChildItemsEnterprise = []
  for (const item of data) {
    const exportFunction = getOperationFunction("ExportToEnterprise", item.elementType)
    if (!exportFunction) throw new Error(`Export function not found for element type: ${item.elementType}`)

    result.push(exportFunction(context, item)!)
  }

  return result
}
