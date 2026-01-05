import { formatElement } from "~/format/formatFactory"
import { formatElementName } from "~/format/helpers"
import { IFormatElementResult } from "~/format/types"
import { addSimpleIndent } from "~/format/wrap/addIndents"
import { ConfigurationContext } from "~/metadata/context/types"
import { UsualGroup } from "../types"

export const formatHorizontalGroup = (element: UsualGroup, context: ConfigurationContext): IFormatElementResult => {
  let result: IFormatElementResult = {
    strings: ["%" + formatElementName(element)],
    haveSimpleHorizontalGroup: false,
  }

  let verticalGroups: string[][] = getVerticalItems(element, context)

  result.strings.push(...verticalGroups.flat())
  return result
}

const getVerticalItems = (element: UsualGroup, context: ConfigurationContext): string[][] => {
  let result: string[][] = []

  if (!element.childItems) return result

  for (const item of element.childItems) {
    const formattedItem = formatElement(item, context)
    result.push(addSimpleIndent(formattedItem.strings))
  }
  return result
}
