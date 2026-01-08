import { formatElements } from "~/format/formatFactory"
import { formatElementName } from "~/format/helpers"
import { FormatElementFunction, IFormatElementResult } from "~/format/types"
import { addSimpleIndent } from "~/format/wrap/addIndents"
import { ConfigurationContext } from "~/metadata/context/types"
import * as t from "~/parser/lexer"
import { BaseElement } from "../baseElement/types"
import { Pages } from "./types"
import { registerIsOneLineElementCheck } from "~/format/isOneLineElementCheckFactory"
import { FormElementType } from "../../../metadataFactory/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"

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

  const childResult = formatElements(childItems, context)

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
