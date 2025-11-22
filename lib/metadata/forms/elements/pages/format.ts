import { formatElements } from "~/lib/format/formatFactory"
import { formatElementName } from "~/lib/format/helpers"
import { FormatElementFunction, IFormatElementResult } from "~/lib/format/types"
import { addSimpleIndent } from "~/lib/format/wrap/addIndents"
import { TConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import * as t from "~/lib/parser/lexer"
import { TBaseElement } from "../baseElement/types"
import { TPages } from "./types"
const SLASH = (t.Slash.LABEL as string).repeat(2)

export const formatPages: FormatElementFunction = (
  element: TBaseElement,
  configurationSettings: TConfigurationSettings
): IFormatElementResult => {
  const pagesElement = element as TPages
  const result: IFormatElementResult = {
    strings: [],
    haveSimpleHorizontalGroup: false,
  }

  const header = getHeader(pagesElement)
  result.strings.push(header)

  const childResult = formatElements(
    pagesElement.childItems,
    configurationSettings
  )

  const indentedStrings = addSimpleIndent(childResult.strings)

  result.strings.push(...indentedStrings)
  result.haveSimpleHorizontalGroup =
    result.haveSimpleHorizontalGroup || childResult.haveSimpleHorizontalGroup
  return result
}

const getHeader = (element: TPages): string => {
  let result = SLASH

  result += element.title?.items.ru ?? ""

  result += formatElementName(element)

  return result
}
