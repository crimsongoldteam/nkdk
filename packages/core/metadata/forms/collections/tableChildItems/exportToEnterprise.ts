import { ConfigurationContext } from "~/metadata/context/types"
import { getOperationFunction } from "~/metadata/metadataFactory/metadataFactory"
import { TableChildItemPartialEnterprise, TableChildItems, TableChildItemsPartialEnterprise } from "./types"

export const exportTableChildItemsToEnterprise = (
  context: ConfigurationContext,
  data: TableChildItems | undefined
): TableChildItemsPartialEnterprise | undefined => {
  if (!data || data.length === 0) return undefined

  const result: TableChildItemsPartialEnterprise = {}
  for (const item of data) {
    const fn = getOperationFunction("ExportTypedToEnterprise", item.elementType)
    if (fn == undefined) throw new Error(`Export function not found for element type: ${item.elementType}`)
    const resultItem = fn(context, item)
    result[item.name] = resultItem as TableChildItemPartialEnterprise
  }

  return result
}
