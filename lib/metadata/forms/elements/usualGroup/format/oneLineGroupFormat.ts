import { TUsualGroup } from "../types"
import { formatElement } from "~/lib/format/formatFactory"
import { IFormatElementResult, WrapInGroupStrategy } from "~/lib/format/types"
import { formatElementTitleAndName } from "~/lib/format/helpers"
import { TBaseElement } from "../../baseElement/types"

export const formatOneLineGroup = (
  element: TUsualGroup
): IFormatElementResult => {
  const separatorSymbol = ";"
  const separator = separatorSymbol + " "

  let result: IFormatElementResult = {
    strings: [],
    haveSimpleHorizontalGroup: false,
  }

  if (element.childItems.length === 0) {
    result.strings.push(separatorSymbol)
    return result
  }

  let groupItems: string[][] = []

  let isFirst = true
  for (const item of element.childItems) {
    const itemResult = formatElement(item as TBaseElement, {
      isFirst: isFirst,
      wrapInGroup: WrapInGroupStrategy.Auto,
      level: 0,
    })
    groupItems.push(itemResult.strings)
    isFirst = false
  }

  let resultLine =
    "-" + formatElementTitleAndName(element) + "; " + groupItems.join(separator)

  result.strings.push(resultLine)

  return result
}
