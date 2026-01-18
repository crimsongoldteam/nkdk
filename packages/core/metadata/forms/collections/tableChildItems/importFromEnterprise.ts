import { ConfigurationContext } from "~/metadata/context/types"
import { getOperationFunction } from "~/metadata/metadataFactory/metadataFactory"
import { importFormElementTypeFromEnterprise } from "~/metadata/metadataFactory/types"
import { TableChildItem, TableChildItems, TableChildItemsEnterprise } from "./types"

export const importTableChildItemsFromEnterprise = (
  context: ConfigurationContext,
  data: TableChildItemsEnterprise | undefined
): TableChildItems => {
  if (!data) return []

  const result: TableChildItems = []
  for (const [name, itemData] of Object.entries(data)) {
    const elementType = importFormElementTypeFromEnterprise(context, itemData.Тип)

    const fn = getOperationFunction("ImportTypedFromEnterprise", elementType)
    if (fn == undefined) throw new Error(`Import function not found for element type: ${elementType}`)
    const item = fn(context, itemData, name) as TableChildItem

    if (item !== undefined) result.push(item)
  }

  return result
}
