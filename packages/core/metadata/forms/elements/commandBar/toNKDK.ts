import { ConfigurationContext } from "~/metadata/context/types"
import { ToNKDKResult } from "~/metadata/metadataFactory/elements/toNKDKGenerator/types"
import { CommandBarPrefix, CommandBarSeparator, CommandBarSuffix } from "~/nkdk/terminal"
import { exportCommandBarChildItemsToNKDK } from "../../commonObjects/childItems/toNKDK"
import { formatElementName } from "../../format/helpers"
import { CommandBar } from "./types"

export const exportCommandBarToNKDK = (params: {
  context: ConfigurationContext
  element: CommandBar
}): ToNKDKResult => {
  const { context, element } = params
  if (!element) return { strings: [], toOneLineGroup: false }

  const childItems = exportCommandBarChildItemsToNKDK(context, element.childItems)

  const content = childItems.strings.length > 0 ? childItems.strings.join(CommandBarSeparator) : ""

  const name = formatElementName(element)
  return {
    strings: [`${CommandBarPrefix}${content}${CommandBarSuffix} ${name}`],
    toOneLineGroup: true,
  }
}
