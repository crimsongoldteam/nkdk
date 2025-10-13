import { TUsualGroup } from "../types"
import * as t from "~/lib/parser/lexer"
import { formatElement } from "~/lib/format/formatFactory"
import { IFormatterParams, WrapInGroupStrategy } from "~/lib/format/types"
import { formatElementName } from "~/lib/format/helpers"
import { formatGroupWrapping } from "~/lib/format/wrap/formatGroupWrapping"

export const formatOneLineGroup = (element: TUsualGroup, params: IFormatterParams): string[] => {
  const separatorSymbol = t.Ampersand.LABEL as string
  const separator = " " + separatorSymbol + " "

  let result: string[] = [formatElementName(element)]

  if (element.childItems.length === 0) {
    result.push(separatorSymbol)
    return result
  }

  let groupItems: string[][] = []

  let isFirst = true
  for (const item of element.childItems) {
    groupItems.push(formatElement(item, { isFirst: isFirst, wrapInGroup: WrapInGroupStrategy.Auto, level: 0 }))
    isFirst = false
  }

  // let resultLine = groupItems.join(separator)

  const indent = "  "
  let resultLine = groupItems.map((item, index) => indent.repeat(index) + (index === 0 ? "" : separator) + item)

  if (element.childItems.length === 1) {
    //Element &
    resultLine.push(separatorSymbol)
  }

  result.push(...resultLine)

  return formatGroupWrapping(result, params)
}
