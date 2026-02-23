import { ConfigurationContext } from "~/metadata/context/types"
import { ToNKDKResult } from "~/metadata/metadataFactory/elements/toNKDKGenerator/types"
import { exportCommandBarItemsToStructure, formatCommandBarContent } from "../../format/commandBarHelpers"
import { AutoCommandBar } from "./types"

export const exportAutoCommandBarToStructure = (
  context: ConfigurationContext,
  element: AutoCommandBar | undefined
): ToNKDKResult => {
  if (!element) return { strings: [], toOneLineGroup: false }

  const content = exportAutoCommandBarContentToStructure(context, element)

  return {
    strings: [content],
    toOneLineGroup: false,
  }
}

export const exportAutoCommandBarContentToStructure = (
  context: ConfigurationContext,
  element: AutoCommandBar
): string => {
  const buttonStrings = exportCommandBarItemsToStructure(context, element.childItems)
  const autofill = element.autofill !== false

  return formatCommandBarContent(buttonStrings, autofill)
}
