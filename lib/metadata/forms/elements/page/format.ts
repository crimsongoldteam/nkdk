import { TPage } from "./types"
import { FormatElementFunction, IFormatElementResult } from "~/lib/format/types"
import { formatElements } from "~/lib/format/formatFactory"
import * as t from "~/lib/parser/lexer"
import { formatElementTitleAndName } from "~/lib/format/helpers"
import { addSimpleIndent } from "~/lib/format/wrap/addIndents"
import { TNamedElementWithTitle } from "../baseElement/types"
import { TConfigurationSettings } from "~/lib/metadata/configurationSettings/types"

export const formatPage: FormatElementFunction = (
  element: TPage,
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

const getHeader = (element: TPage): string => {
  let result = t.Slash.LABEL as string

  result += formatElementTitleAndName(
    element as unknown as TNamedElementWithTitle
  )

  return result
}
