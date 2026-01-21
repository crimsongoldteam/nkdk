import { ConfigurationContext } from "~/metadata/context/types"
import { getOperationFunction } from "~/metadata/metadataFactory/metadataFactory"
import { CommandBarChildItems } from "./types"

export const exportCommandBarChildItemsToStructure = (
  context: ConfigurationContext,
  childItems: CommandBarChildItems
): string[] => {
  const buttons: string[] = []

  for (const item of childItems) {
    const exportFunction = getOperationFunction("ExportToStructureContent", item.elementType)

    if (!exportFunction)
      throw new Error(`ExportToStructureContent function not found for element type: ${item.elementType}`)
    const result = exportFunction(context, item)
    buttons.push(...result.strings)
  }

  return buttons
}
