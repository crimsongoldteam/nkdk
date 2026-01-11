import { ConfigurationContext } from "~/metadata/context/types"
import { getOperationFunction } from "~/metadata/metadataFactory/metadataFactory"
import { ButtonGroupChildItems } from "./types"

export const exportButtonGroupChildItemsToStructure = (
  context: ConfigurationContext,
  childItems: ButtonGroupChildItems
): string[] => {
  const buttons: string[] = []

  for (const item of childItems) {
    const exportFunction = getOperationFunction("ExportToStructureContent", item.elementType)

    if (!exportFunction) throw new Error(`Export function not found for element type: ${item.elementType}`)
    const result = exportFunction(context, item)
    buttons.push(...result.strings)
  }

  return buttons
}
