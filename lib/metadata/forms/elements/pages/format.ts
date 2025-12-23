import { formatElements } from "~/lib/format/formatFactory"
import { formatElementName } from "~/lib/format/helpers"
import { FormatElementFunction, IFormatElementResult } from "~/lib/format/types"
import { addSimpleIndent } from "~/lib/format/wrap/addIndents"
import { Context } from "~/lib/metadata/context/types"
import * as t from "~/lib/parser/lexer"
import { BaseElement } from "../baseElement/types"
import { Pages } from "./types"
const SLASH = (t.Slash.LABEL as string).repeat(2)

export const formatPages: FormatElementFunction = (
  element: BaseElement,
  configurationSettings: Context
): IFormatElementResult => {
  const pagesElement = element as Pages
  const childItems = pagesElement.childItems ?? []
  const result: IFormatElementResult = {
    strings: [],
    haveSimpleHorizontalGroup: false,
  }

  const header = getHeader(pagesElement)
  result.strings.push(header)

  const childResult = formatElements(childItems, configurationSettings)

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
