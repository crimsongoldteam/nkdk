import { ConfigurationContext } from "~/metadata/context/types"
import { getOperationFunction } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { wrapButtonContent } from "./helpers"
import { PropertyRule } from "../elements/calendarField/rules"

export const exportCommandBarItemsToStructure = (
  context: ConfigurationContext,
  rule: PropertyRule | undefined,
  childItems: { elementType: FormElementType }[]
): string[] => {
  return childItems.flatMap((item) => {
    const exportFunction = getOperationFunction("ExportToStructureContent", item.elementType)

    if (!exportFunction)
      throw new Error(`ExportToStructureContent function not found for element type: ${item.elementType}`)
    const result = exportFunction(context, rule, item)
    return result.strings
  })
}

export const formatCommandBarContent = (buttonStrings: string[], autofill: boolean = false): string => {
  const buttons = autofill ? ["...", ...buttonStrings] : buttonStrings

  const content = buttons.length > 0 ? buttons.join(" | ") : ""
  const finalContent =
    buttons.length === 0 ? "|" : buttons.length === 1 ? (buttons[0] === "..." ? "...|" : buttons[0] + " |") : content

  return wrapButtonContent(finalContent)
}
