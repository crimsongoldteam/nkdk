import { ConfigurationContext } from "~/metadata/context/types"
import { getOperationFunction } from "~/metadata/metadataFactory/metadataFactory"
import { importFormElementTypeFromEnterprise } from "~/metadata/metadataFactory/types"
import { ButtonGroupChildItems, ButtonGroupChildItemsEnterprise } from "./types"

export const importButtonGroupChildItemsFromEnterprise = (
  context: ConfigurationContext,
  data: ButtonGroupChildItemsEnterprise | undefined
): ButtonGroupChildItems | undefined => {
  if (!data) return undefined

  const result: ButtonGroupChildItems = []
  for (const [name, itemData] of Object.entries(data)) {
    const elementType = importFormElementTypeFromEnterprise(context, itemData.Тип)

    const importFunction = getOperationFunction("ImportFromEnterprise", elementType)
    if (!importFunction) throw new Error(`Import function not found for element type: ${elementType}`)

    const item = importFunction(context, itemData, name)
    result.push(item)
  }

  return result.length > 0 ? result : undefined
}
