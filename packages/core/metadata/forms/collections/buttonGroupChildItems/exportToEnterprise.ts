import { ConfigurationContext } from "~/metadata/context/types"
import { getOperationFunction } from "~/metadata/metadataFactory/metadataFactory"
import { ButtonGroupChildItems, ButtonGroupChildItemsEnterprise } from "./types"

export const exportButtonGroupChildItemsToEnterprise = (
  context: ConfigurationContext,
  data: ButtonGroupChildItems | undefined
): ButtonGroupChildItemsEnterprise | undefined => {
  if (!data || data.length === 0) return undefined

  const result: ButtonGroupChildItemsEnterprise = {}
  for (const item of data) {
    const exportFunction = getOperationFunction("ExportTypedToEnterprise", item.elementType)
    if (!exportFunction) throw new Error(`Export function not found for element type: ${item.elementType}`)
    const value = exportFunction(context, item)
    result[item.name] = value
  }

  return result
}
