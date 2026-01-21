import { ConfigurationContext } from "~/metadata/context/types"
import { getOperationFunction } from "~/metadata/metadataFactory/metadataFactory"
import { TableChildItemTypedEnterprise, TableChildItems, TableChildItemsTypedEnterprise } from "./types"

export const exportTableChildItemsToEnterprise = (
  context: ConfigurationContext,
  data: TableChildItems | undefined
): TableChildItemsTypedEnterprise | undefined => {
  if (!data || data.length === 0) return undefined

  const result: TableChildItemsTypedEnterprise = {}
  for (const item of data) {
    const fn = getOperationFunction("ExportTypedToEnterprise", item.elementType)
    if (fn == undefined)
      throw new Error(`ExportTypedToEnterprise function not found for element type: ${item.elementType}`)
    const resultItem = fn(context, item)
    result[item.name] = resultItem as TableChildItemTypedEnterprise
  }

  return result
}
