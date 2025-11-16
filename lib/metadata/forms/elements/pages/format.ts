import { TPages } from "./types"
import {
  FormatFunction,
  IFormatElementResult,
  IFormatterParams,
} from "~/lib/format/types"
import { formatElements } from "~/lib/format/formatFactory"
import { formatElementName } from "~/lib/format/helpers"
import * as t from "~/lib/parser/lexer"
import { addSimpleIndent } from "~/lib/format/wrap/addIndents"
import { TBaseElement } from "../baseElement/types"
const SLASH = (t.Slash.LABEL as string).repeat(2)

export const formatPages: FormatFunction<TPages> = (
  element: TPages,
  _params: IFormatterParams
): IFormatElementResult => {
  const result: IFormatElementResult = {
    strings: [],
    haveSimpleHorizontalGroup: false,
  }

  const header = getHeader(element)
  result.strings.push(header)

  const childResult = formatElements(element.childItems as TBaseElement[])

  const indentedStrings = addSimpleIndent(childResult.strings)

  result.strings.push(...indentedStrings)
  result.haveSimpleHorizontalGroup =
    result.haveSimpleHorizontalGroup || childResult.haveSimpleHorizontalGroup
  return result
}

const getHeader = (element: TPages): string => {
  let result = SLASH

  result += element.title?.items.ru ?? ""

  result += formatElementName(element as TBaseElement)

  return result
}
