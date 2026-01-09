import { formatElementTitleAndName } from "~/format/helpers"
import { registerIsOneLineElementCheck } from "~/format/isOneLineElementCheckFactory"
import { FormatElementFunction, IFormatElementResult } from "~/format/types"
import { addSimpleIndent } from "~/format/wrap/addIndents"
import { ConfigurationContext } from "~/metadata/context/types"
import * as t from "~/metadata/forms/elements/childItems/parser/lexer"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "../../../metadataFactory/types"
import { BaseElement } from "../baseElement/types"
import { exportChildItemsToStructure } from "../childItems/exportToStructure"
import { Page } from "./types"

export const exportPageToStructure: FormatElementFunction = (
  context: ConfigurationContext,
  element: BaseElement
): IFormatElementResult => {
  const pageElement = element as Page
  const childItems = pageElement.childItems ?? []

  const result: IFormatElementResult = {
    strings: [],
    haveSimpleHorizontalGroup: false,
  }

  const header = getHeader(pageElement)
  result.strings.push(header)

  const childResult = exportChildItemsToStructure(context, childItems)
  const indentedStrings = addSimpleIndent(childResult.strings)
  result.strings.push(...indentedStrings)
  result.haveSimpleHorizontalGroup = result.haveSimpleHorizontalGroup || childResult.haveSimpleHorizontalGroup
  return result
}

const getHeader = (element: Page): string => {
  let result = t.Slash.LABEL as string

  result += formatElementTitleAndName(element)

  return result
}

registerIsOneLineElementCheck(FormElementType.Page, () => false)
registerMetadata("ExportToStructure", "Page", exportPageToStructure)
