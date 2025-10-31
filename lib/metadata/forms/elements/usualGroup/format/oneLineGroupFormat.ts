import { TUsualGroup } from "../types"
import { formatElement } from "~/lib/format/formatFactory"
import { IFormatElementResult, WrapInGroupStrategy } from "~/lib/format/types"
import { formatElementTitleAndName } from "~/lib/format/helpers"

export const formatOneLineGroup = (element: TUsualGroup): IFormatElementResult => {
  const separatorSymbol = ";"
  const separator = separatorSymbol + " "

  let result: IFormatElementResult = { strings: [], haveSimpleHorizontalGroup: false }

  if (element.childItems.length === 0) {
    result.strings.push(separatorSymbol)
    return result
  }

  let groupItems: string[][] = []

  let isFirst = true
  for (const item of element.childItems) {
    const itemResult = formatElement(item, { isFirst: isFirst, wrapInGroup: WrapInGroupStrategy.Auto, level: 0 })
    groupItems.push(itemResult.strings)
    isFirst = false
  }

  let resultLine = "-" + formatElementTitleAndName(element) + "; " + groupItems.join(separator)

  // const indent = "  "
  // let resultLine = groupItems.map((item, index) => indent.repeat(index) + (index === 0 ? "" : separator) + item)

  // if (element.childItems.length === 1) {
  //Element &
  // resultLine.push(separatorSymbol)
  // }

  result.strings.push(resultLine)

  return result
}
