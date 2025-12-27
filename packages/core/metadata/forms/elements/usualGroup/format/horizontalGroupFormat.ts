import { formatElement } from "~/packages/core/format/formatFactory"
import { formatElementName } from "~/packages/core/format/helpers"
import { IFormatElementResult } from "~/packages/core/format/types"
import { addSimpleIndent } from "~/packages/core/format/wrap/addIndents"
import { Context } from "~/packages/core/metadata/context/types"
import { UsualGroup } from "../types"

export const formatHorizontalGroup = (element: UsualGroup, context: Context): IFormatElementResult => {
  let result: IFormatElementResult = {
    strings: ["%" + formatElementName(element)],
    haveSimpleHorizontalGroup: false,
  }

  let verticalGroups: string[][] = getVerticalItems(element, context)

  result.strings.push(...verticalGroups.flat())
  return result
}

const getVerticalItems = (element: UsualGroup, context: Context): string[][] => {
  let result: string[][] = []

  if (!element.childItems) return result

  for (const item of element.childItems) {
    const formattedItem = formatElement(item, context)
    result.push(addSimpleIndent(formattedItem.strings))
  }
  return result
}
