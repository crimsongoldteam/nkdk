import { ConfigurationContext } from "~/metadata/context/types"
import { FormElementType } from "~/metadata/orchestration"
import { wrapButtonContent } from "./helpers"

export const exportCommandBarItemsToStructure = (
  context: ConfigurationContext,
  childItems: { itemType: FormElementType }[]
): string[] => {
  return childItems.flatMap((item) => {
    const exportFunction = getElementOperationFunction("ExportToStructureContent", item.itemType)

    if (!exportFunction)
      throw new Error(`ExportToStructureContent function not found for element type: ${item.itemType}`)
    const result = exportFunction(context, item)
    return result.strings
  })
}

export const formatCommandBarContent = (buttonStrings: string[], autofill: boolean = false): string => {
  const buttons = autofill ? ["...", ...buttonStrings] : buttonStrings

  const content = buttons.length > 0 ? buttons.join(" | ") : ""

  return wrapButtonContent(content)
}
