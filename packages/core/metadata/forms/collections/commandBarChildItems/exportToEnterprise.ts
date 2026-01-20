import { ConfigurationContext } from "~/metadata/context/types"
import { getOperationFunction } from "~/metadata/metadataFactory/metadataFactory"
import { CommandBarChildItems, CommandBarChildItemsTypedEnterprise, CommandBarChildItemTypedEnterprise } from "./types"

export const exportCommandBarChildItemsToEnterprise = (
  context: ConfigurationContext,
  data: CommandBarChildItems | undefined
): CommandBarChildItemsTypedEnterprise | undefined => {
  if (!data || data.length === 0) return undefined

  const result: CommandBarChildItemsTypedEnterprise = {}
  for (const item of data) {
    const fn = getOperationFunction("ExportTypedToEnterprise", item.elementType)
    if (fn == undefined) throw new Error(`Export function not found for element type: ${item.elementType}`)
    const resultItem = fn(context, item)
    result[item.name] = resultItem as CommandBarChildItemTypedEnterprise
  }

  return result
}
