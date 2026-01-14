import { ConfigurationContext } from "~/metadata/context/types"
import { getOperationFunction } from "~/metadata/metadataFactory/metadataFactory"
import { ButtonGroupChildItemEnterprise, ButtonGroupChildItems, ButtonGroupChildItemsEnterprise } from "./types"

export const exportButtonGroupChildItemsToEnterprise = (
  context: ConfigurationContext,
  data: ButtonGroupChildItems | undefined
): ButtonGroupChildItemsEnterprise | undefined => {
  if (!data || data.length === 0) return undefined

  const result: ButtonGroupChildItemsEnterprise = {}
  for (const item of data) {
    const fn = getOperationFunction("ExportTypedToEnterprise", item.elementType)
    if (fn == undefined) throw new Error(`Export function not found for element type: ${item.elementType}`)
    const resultItem = fn(context, item)
    result[item.name] = resultItem as ButtonGroupChildItemEnterprise
  }

  return result
}
