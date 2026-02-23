import { ConfigurationContext } from "~/metadata/context/types"
import { ToNKDKResult } from "~/metadata/metadataFactory/elements/toNKDKGenerator/types"
import { addIndentation } from "~/nkdk/helper"
import { PagesPrefix } from "~/nkdk/terminal"
import { exportChildItemsToNKDK } from "../../commonObjects/childItems/toNKDK"
import { formatElementTitleAndName } from "../../format/helpers"
import { Pages } from "./types"

export const exportPagesToNKDK = (params: { context: ConfigurationContext; element: Pages }): ToNKDKResult => {
  const { context, element } = params
  const pagesElement = element as Pages
  const childItems = pagesElement.childItems ?? []
  const result: ToNKDKResult = {
    strings: [],
    toOneLineGroup: false,
  }

  const header = getHeader(context, pagesElement)
  result.strings.push(header)

  const childResult = exportChildItemsToNKDK(context, childItems)

  const indentedStrings = addIndentation(childResult.strings)

  result.strings.push(...indentedStrings)
  return result
}

const getHeader = (context: ConfigurationContext, element: Pages): string => {
  return PagesPrefix + formatElementTitleAndName(context, element)
}
