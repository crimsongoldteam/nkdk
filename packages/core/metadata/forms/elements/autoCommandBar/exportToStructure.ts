import { ConfigurationContext } from "~/metadata/context/types"
import { exportButtonGroupChildItemsToStructure } from "../../collections/buttonGroupChildItems/exportToStructure"
import { wrapButtonContent } from "../../format/helpers"
import { IFormatElementResult } from "../../format/types"
import { AutoCommandBar } from "./types"

export const exportAutoCommandBarToStructure = (
  context: ConfigurationContext,
  element: AutoCommandBar
): IFormatElementResult => {
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

  buttons.push(...exportButtonGroupChildItemsToStructure(context, element.childItems))

  return wrapButtonContent(buttons.join(" | "))
}
