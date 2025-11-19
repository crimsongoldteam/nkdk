import { TPages } from "./types"
import { FormatElementFunction, IFormatElementResult } from "~/lib/format/types"
import { formatElements } from "~/lib/format/formatFactory"
import { formatElementName } from "~/lib/format/helpers"
import * as t from "~/lib/parser/lexer"
import { addSimpleIndent } from "~/lib/format/wrap/addIndents"
import { TConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
const SLASH = (t.Slash.LABEL as string).repeat(2)

export const formatPages: FormatElementFunction = (
  element: TPages,
  configurationSettings: TConfigurationSettings
): IFormatElementResult => {
  const result: IFormatElementResult = {
    strings: [],
    haveSimpleHorizontalGroup: false,
  }

  const header = getHeader(element)
  result.strings.push(header)

  const childResult = formatElements(element.childItems, configurationSettings)

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
