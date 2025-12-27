import { formatElements } from "~/packages/core/format/formatFactory"
import { formatElementTitleAndName } from "~/packages/core/format/helpers"
import { FormatElementFunction, IFormatElementResult } from "~/packages/core/format/types"
import { addSimpleIndent } from "~/packages/core/format/wrap/addIndents"
import { Context } from "~/packages/core/metadata/context/types"
import * as t from "~/packages/core/parser/lexer"
import { BaseElement } from "../baseElement/types"
import { Page } from "./types"

export const formatPage: FormatElementFunction = (element: BaseElement, context: Context): IFormatElementResult => {
  const pageElement = element as Page
  const childItems = pageElement.childItems ?? []

  const result: IFormatElementResult = {
    strings: [],
    haveSimpleHorizontalGroup: false,
  }

  const header = getHeader(pageElement)
  result.strings.push(header)

  const childResult = formatElements(childItems, context)
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
