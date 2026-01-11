import { ConfigurationContext } from "~/metadata/context/types"
import { exportButtonGroupChildItemsToStructure } from "../../collections/buttonGroupChildItems/exportToStructure"
import { wrapButtonContent } from "../../format/helpers"
import { IFormatElementResult } from "../../format/types"
import { exportCommandBarContentToStructure } from "../commandBar/exportToStructure"
import { AutoCommandBar } from "./types"

export const exportAutoCommandBarToStructure = (
  context: ConfigurationContext,
  element: AutoCommandBar
): IFormatElementResult => {
  const content = exportCommandBarContentToStructure(context, element)

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

  if (element.autofill) {
    buttons.push("...")
  }

  buttons.push(...exportButtonGroupChildItemsToStructure(context, element.childItems))

  return wrapButtonContent(buttons.join(" | "))
}
