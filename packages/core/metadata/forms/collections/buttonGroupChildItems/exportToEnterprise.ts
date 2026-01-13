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
    const fn = getOperationFunction("ExportPartialToEnterprise", item.elementType)(context, item)
    if (fn == undefined) throw new Error(`Export function not found for element type: ${item.elementType}`)
    result[item.name] = fn(context, item)
  }

  return result
}
