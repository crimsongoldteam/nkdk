import { ConfigurationContext } from "~/metadata/context/types"
import { getOperationFunction } from "~/metadata/metadataFactory/metadataFactory"
import { TableChildItems } from "./types"

export const exportTableChildItemsToStructure = (
  context: ConfigurationContext,
  childItems: TableChildItems
): string[] => {
  const items: string[] = []

  for (const item of childItems) {
    const exportFunction = getOperationFunction("ExportToStructureContent", item.elementType)

    if (!exportFunction)
      throw new Error(`ExportToStructureContent function not found for element type: ${item.elementType}`)
    const result = exportFunction(context, item)
    items.push(...result.strings)
  }

  return items
}
