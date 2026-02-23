import { ConfigurationContext } from "~/metadata/context/types"
import * as t from "~/metadata/forms/commonObjects/childItems/parser/tokenizer/lexer"
import { formatElementTitleAndName } from "~/metadata/forms/format/helpers"
import { addSimpleIndent } from "~/metadata/forms/format/wrap/addIndents"
import { ToNKDKResult } from "~/metadata/metadataFactory/elements/toNKDKGenerator/types"
import { exportChildItemsToNKDK } from "../../commonObjects/childItems/exportToStructure"
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
  const indentedStrings = addSimpleIndent(childResult.strings)
  result.strings.push(...indentedStrings)
  result.toOneLineGroup = result.toOneLineGroup || childResult.toOneLineGroup
  return result
}

const getHeader = (context: ConfigurationContext, element: Page): string => {
  let result = t.Slash.LABEL as string

  result += formatElementTitleAndName(context, element)

  return result
}
