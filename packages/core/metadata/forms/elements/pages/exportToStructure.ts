import { formatElementName } from "~/format/helpers"
import { registerIsOneLineElementCheck } from "~/format/isOneLineElementCheckFactory"
import { FormatElementFunction, IFormatElementResult } from "~/format/types"
import { addSimpleIndent } from "~/format/wrap/addIndents"
import { ConfigurationContext } from "~/metadata/context/types"
import * as t from "~/metadata/forms/elements/childItems/parser/lexer"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "../../../metadataFactory/types"
import { BaseElement } from "../baseElement/types"
import { exportChildItemsToStructure } from "../childItems/exportToStructure"
import { Pages } from "./types"

const SLASH = (t.Slash.LABEL as string).repeat(2)

export const exportPagesToStructure: FormatElementFunction = (
  context: ConfigurationContext,
  element: BaseElement
): IFormatElementResult => {
  const pagesElement = element as Pages
  const childItems = pagesElement.childItems ?? []
  const result: IFormatElementResult = {
    strings: [],
    haveSimpleHorizontalGroup: false,
  }

  const header = getHeader(pagesElement)
  result.strings.push(header)

  const childResult = exportChildItemsToStructure(context, childItems)

  const indentedStrings = addSimpleIndent(childResult.strings)

  result.strings.push(...indentedStrings)
  result.haveSimpleHorizontalGroup = result.haveSimpleHorizontalGroup || childResult.haveSimpleHorizontalGroup
  return result
}

const getHeader = (element: Pages): string => {
  let result = SLASH

  result += element.title?.items.ru ?? ""

  result += formatElementName(element)

  return result
}

registerIsOneLineElementCheck(FormElementType.Pages, () => false)
registerMetadata("ExportToStructure", "Pages", exportPagesToStructure)
