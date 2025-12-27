import { formatElements } from "~/packages/core/format/formatFactory"
import { formatElementName } from "~/packages/core/format/helpers"
import { FormatElementFunction, IFormatElementResult } from "~/packages/core/format/types"
import { addSimpleIndent } from "~/packages/core/format/wrap/addIndents"
import { Context } from "~/packages/core/metadata/context/types"
import * as t from "~/packages/core/parser/lexer"
import { BaseElement } from "../baseElement/types"
import { Pages } from "./types"
const SLASH = (t.Slash.LABEL as string).repeat(2)

export const formatPages: FormatElementFunction = (element: BaseElement, context: Context): IFormatElementResult => {
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
