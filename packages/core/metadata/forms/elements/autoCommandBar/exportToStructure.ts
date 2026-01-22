import { ConfigurationContext } from "~/metadata/context/types"
import { wrapButtonContent } from "../../format/helpers"
import { IFormatElementResult } from "../../format/types"
import { AutoCommandBar } from "./types"
import { exportChildItemsToStructure } from "../../collections/childItems/exportToStructure"

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

  const childItems = exportChildItemsToStructure(context, element.childItems)
  buttons.push(...childItems.strings)

  const content = buttons.length > 0 ? buttons.join(" | ") : ""
  const finalContent = buttons.length === 1 && buttons[0] === "..." ? "...|" : content || "|"

  return wrapButtonContent(finalContent)
}
