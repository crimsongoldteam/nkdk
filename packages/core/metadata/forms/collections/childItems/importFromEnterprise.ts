import { ConfigurationContext } from "~/metadata/context/types"
import { getOperationFunction } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { ChildItem, ChildItemEnterprise, ChildItems, ChildItemsEnterprise } from "./types"

export const importChildItemsFromEnterprise = (
  context: ConfigurationContext,
  data: ChildItemsEnterprise | undefined
): ChildItems | undefined => {
  if (!data) return undefined

  const result: ChildItems = []
  for (const [elementType, itemData] of Object.entries(data)) {
    const importFunction = getOperationFunction("ImportFromEnterprise", elementType as FormElementType)
    if (!importFunction) throw new Error(`Import function not found for element type: ${elementType}`)
    const item = importFunction(context, itemData as ChildItemEnterprise, "")
    if (item !== undefined) {
      result.push(item as ChildItem)
    }
  }

  return result.length > 0 ? result : undefined
}
