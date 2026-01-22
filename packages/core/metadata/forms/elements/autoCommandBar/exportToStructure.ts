import { ConfigurationContext } from "~/metadata/context/types"
import { getOperationFunction } from "~/metadata/metadataFactory/metadataFactory"
import { wrapButtonContent } from "../../format/helpers"
import { IFormatElementResult } from "../../format/types"
import { AutoCommandBar } from "./types"

export const exportAutoCommandBarToStructure = (
  context: ConfigurationContext,
  element: AutoCommandBar | undefined
): IFormatElementResult => {
  if (!element) return { strings: [], haveSimpleHorizontalGroup: false }

  const content = exportAutoCommandBarContentToStructure(context, element)

  return {
    strings: [content],
    haveSimpleHorizontalGroup: false,
  }
}

export const exportAutoCommandBarContentToStructure = (
  context: ConfigurationContext,
  element: AutoCommandBar
): string => {
  const buttons = []

  if (element.autofill != false) {
    buttons.push("...")
  }

  const buttonStrings = element.childItems.flatMap((item) => {
    const exportFunction = getOperationFunction("ExportToStructureContent", item.elementType)

    if (!exportFunction)
      throw new Error(`ExportToStructureContent function not found for element type: ${item.elementType}`)
    const result = exportFunction(context, item)
    return result.strings
  })

  buttons.push(...buttonStrings)

  const content = buttons.length > 0 ? buttons.join(" | ") : ""
  const finalContent = buttons.length === 1 && buttons[0] === "..." ? "...|" : content || "|"

  return wrapButtonContent(finalContent)
}
