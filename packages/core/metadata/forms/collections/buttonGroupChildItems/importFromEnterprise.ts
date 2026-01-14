import { ConfigurationContext } from "~/metadata/context/types"
import { getOperationFunction } from "~/metadata/metadataFactory/metadataFactory"
import { importFormElementTypeFromEnterprise } from "~/metadata/metadataFactory/types"
import { ButtonGroupChildItem, ButtonGroupChildItems, ButtonGroupChildItemsEnterprise } from "./types"

export const importButtonGroupChildItemsFromEnterprise = (
  context: ConfigurationContext,
  data: ButtonGroupChildItemsEnterprise | undefined
): ButtonGroupChildItems => {
  if (!data) return []

  const result: ButtonGroupChildItems = []
  for (const [name, itemData] of Object.entries(data)) {
    const elementType = importFormElementTypeFromEnterprise(context, itemData.Тип)

    const fn = getOperationFunction("ImportTypedFromEnterprise", elementType)
    if (fn == undefined) throw new Error(`Import function not found for element type: ${elementType}`)
    const item = fn<ButtonGroupChildItem>(context, itemData, name)

    if (item !== undefined) result.push(item)
  }

  return result
}
