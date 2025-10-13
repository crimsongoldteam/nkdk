import { TPage } from "./types"
import { FormatFunction, IFormatterParams } from "~/lib/format/types"
import { formatElements } from "~/lib/format/formatFactory"
import * as t from "~/lib/parser/lexer"
import { formatElementName } from "~/lib/format/helpers"
import { formatCommonWrapping } from "~/lib/format/wrap/formatCommonWrapping"

export const formatPage: FormatFunction<TPage> = (element: TPage, params: IFormatterParams): string[] => {
  const result: string[] = []

  const header = getHeader(element)
  result.push(header)

  result.push(...formatElements(element.childItems))
  return formatCommonWrapping(result, params)
}

const getHeader = (element: TPage): string => {
  let result = t.Slash.LABEL as string

  result += element.title?.ru ?? ""

  result += formatElementName(element)

  return result
}
