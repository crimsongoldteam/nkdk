import { TPages } from "./types"
import { FormatFunction, IFormatElementResult, IFormatterParams } from "~/lib/format/types"
import { formatElements } from "~/lib/format/formatFactory"
import { formatElementName } from "~/lib/format/helpers"
import * as t from "~/lib/parser/lexer"
import { addSimpleIndent } from "~/lib/format/wrap/addIndents"

const SLASH = (t.Slash.LABEL as string).repeat(2)

export const formatPages: FormatFunction<TPages> = (
  element: TPages,
  params: IFormatterParams
): IFormatElementResult => {
  const result: IFormatElementResult = { strings: [], haveSimpleHorizontalGroup: false }

  const header = getHeader(element)
  result.strings.push(header)

  const childResult = formatElements(element.childItems)

  const indentedStrings = addSimpleIndent(childResult.strings)

  result.strings.push(...indentedStrings)
  result.haveSimpleHorizontalGroup = result.haveSimpleHorizontalGroup || childResult.haveSimpleHorizontalGroup
  return result
}

const getHeader = (element: TPages): string => {
  let result = SLASH

  result += element.title?.ru ?? ""

  result += formatElementName(element)

  return result
}
