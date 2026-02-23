import { ConfigurationContext } from "~/metadata/context/types"
import { ToNKDKResult } from "~/metadata/metadataFactory/elements/toNKDKGenerator/types"
import { CommandBarPrefix, CommandBarSeparator, CommandBarSuffix } from "~/nkdk/terminal"
import { exportCommandBarChildItemsToNKDK } from "../../commonObjects/childItems/toNKDK"
import { CommandBar } from "./types"

export const exportCommandBarToNKDK = (params: {
  context: ConfigurationContext
  element: CommandBar
}): ToNKDKResult => {
  const { context, element } = params
  if (!element) return { strings: [], toOneLineGroup: false }

  const childItems = exportCommandBarChildItemsToNKDK(context, element.childItems)

  const content = formatContent(childItems.strings)

  return {
    strings: [content],
    toOneLineGroup: false,
  }
}

export const formatContent = (buttonStrings: string[]): string => {
  const content = buttonStrings.length > 0 ? buttonStrings.join(CommandBarSeparator) : ""

  return `${CommandBarPrefix}${content}${CommandBarSuffix}`
}
