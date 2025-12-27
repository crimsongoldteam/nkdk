import { formatElement } from "~/packages/core/format/formatFactory"
import { formatElementName } from "~/packages/core/format/helpers"
import { IFormatElementResult } from "~/packages/core/format/types"
import { Context } from "~/packages/core/metadata/context/types"
import { BaseElement } from "../../baseElement/types"
import { UsualGroup } from "../types"

export const formatOneLineGroup = (element: UsualGroup, context: Context): IFormatElementResult => {
  const separatorSymbol = ";"
  const separator = separatorSymbol + " "

  let result: IFormatElementResult = {
    strings: [],
    haveSimpleHorizontalGroup: false,
  }

  if (element.childItems?.length === 0) {
    result.strings.push(separatorSymbol)
    return result
  }

  let groupItems: string[][] = []

  if (element.childItems) {
    for (const item of element.childItems) {
      const itemResult = formatElement(item as BaseElement, context)
      groupItems.push(itemResult.strings)
    }
  }
  let resultLine = "%" + formatElementName(element) + " " + groupItems.join(separator)

  result.strings.push(resultLine)

  return result
}
