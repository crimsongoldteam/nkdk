import { ConfigurationContext } from "~/metadata/context/types"
import { getOperationFunction } from "~/metadata/metadataFactory/metadataFactory"
import { ChildItemEnterprise, ChildItems, ChildItemsEnterprise } from "./types"

export const exportChildItemsToEnterprise = (
  context: ConfigurationContext,
  data: ChildItems | undefined
): ChildItemsEnterprise | undefined => {
  if (!data || data.length === 0) return undefined

  const result: Partial<Record<string, ChildItemEnterprise>> = {}
  for (const item of data) {
    const exportFunction = getOperationFunction("ExportToEnterprise", item.elementType)
    if (!exportFunction) throw new Error(`Export function not found for element type: ${item.elementType}`)
    const value = exportFunction(context, item)
    result[item.name] = value
  }

  return result as ChildItemsEnterprise
}
