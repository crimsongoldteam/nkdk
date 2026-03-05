import { ConfigurationContext } from "~/metadata/context/types"
import { formatElementTitleAndName } from "~/metadata/forms/format/helpers"
import { ToNKDKResult } from "~/metadata/orchestration/formElement/toNKDK/types"
import { addIndentation } from "~/nkdk/helper"
import { PagePrefix } from "~/nkdk/terminal"
import { exportChildItemsToNKDK } from "../../commonObjects/childItems/toNKDK"
import { Page } from "./types"

export const exportPageToNKDK = (params: { context: ConfigurationContext; element: Page }): ToNKDKResult => {
  const { context, element } = params

  const childItems = element.childItems ?? []

  const result: ToNKDKResult = {
    strings: [],
    toOneLineGroup: false,
  }

  const header = getHeader(context, element)
  result.strings.push(header)

  const childResult = exportChildItemsToNKDK(context, childItems)
  const indentedStrings = addIndentation(childResult.strings)
  result.strings.push(...indentedStrings)
  return result
}

const getHeader = (context: ConfigurationContext, element: Page): string => {
  return PagePrefix + formatElementTitleAndName(context, element)
}
