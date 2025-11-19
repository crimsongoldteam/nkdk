import { TPage } from "./types"
import {
  FormatElementFunction,
  IFormatElementResult,
  IFormatterParams,
} from "~/lib/format/types"
import { formatElements } from "~/lib/format/formatFactory"
import * as t from "~/lib/parser/lexer"
import { formatElementTitleAndName } from "~/lib/format/helpers"
import { addSimpleIndent } from "~/lib/format/wrap/addIndents"
import { TBaseElement, TNamedElementWithTitle } from "../baseElement/types"

export const formatPage: FormatElementFunction<TPage> = (
  element: TPage,
  _params: IFormatterParams
): IFormatElementResult => {
  const result: IFormatElementResult = {
    strings: [],
    haveSimpleHorizontalGroup: false,
  }

  const header = getHeader(element)
  result.strings.push(header)

  const childResult = formatElements(
    element.childItems as unknown as TBaseElement[]
  )
  const indentedStrings = addSimpleIndent(childResult.strings)
  result.strings.push(...indentedStrings)
  result.haveSimpleHorizontalGroup =
    result.haveSimpleHorizontalGroup || childResult.haveSimpleHorizontalGroup
  return result
}

const getHeader = (element: TPage): string => {
  let result = t.Slash.LABEL as string

  result += formatElementTitleAndName(
    element as unknown as TNamedElementWithTitle
  )

  return result
}
