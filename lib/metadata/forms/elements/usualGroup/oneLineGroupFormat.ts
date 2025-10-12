import { TUsualGroup } from "./types"
import * as t from "~/lib/parser/lexer"
import { formatElement } from "~/lib/format/formatFactory"
import { WrapInGroupStrategy } from "~/lib/format/types"

export const formatOneLineGroup = (element: TUsualGroup): string[] => {
  const separatorSymbol = t.Ampersand.LABEL as string
  const separator = " " + separatorSymbol + " "

  let result: string[] = []

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

  let resultLine = groupItems.join(separator)

  if (element.childItems.length === 1) {
    //Element &
    resultLine += " " + separatorSymbol
  }

  result.push(resultLine)

  return result
}
