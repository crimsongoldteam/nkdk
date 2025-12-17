import { formatElements } from "~/lib/format/formatFactory"
import { formatElementTitleAndName } from "~/lib/format/helpers"
import { FormatElementFunction, IFormatElementResult } from "~/lib/format/types"
import { addSimpleIndent } from "~/lib/format/wrap/addIndents"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import * as t from "~/lib/parser/lexer"
import { BaseElement } from "../baseElement/types"
import { Page } from "./types"

export const formatPage: FormatElementFunction = (
  element: BaseElement,
  configurationSettings: ConfigurationSettings
): IFormatElementResult => {
  const pageElement = element as Page
  const result: IFormatElementResult = {
    strings: [],
    haveSimpleHorizontalGroup: false,
  }

  const header = getHeader(pageElement)
  result.strings.push(header)

  const childResult = formatElements(pageElement.childItems, configurationSettings)
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
