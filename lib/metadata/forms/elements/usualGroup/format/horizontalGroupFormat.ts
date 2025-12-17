import { formatElement } from "~/lib/format/formatFactory"
import { formatElementName } from "~/lib/format/helpers"
import { IFormatElementResult } from "~/lib/format/types"
import { addSimpleIndent } from "~/lib/format/wrap/addIndents"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { UsualGroup } from "../types"

export const formatHorizontalGroup = (
  element: UsualGroup,
  configurationSettings: ConfigurationSettings
): IFormatElementResult => {
  let result: IFormatElementResult = {
    strings: ["%" + formatElementName(element)],
    haveSimpleHorizontalGroup: false,
  }

  let verticalGroups: string[][] = getVerticalItems(element, configurationSettings)

  result.strings.push(...verticalGroups.flat())
  return result
}

const getVerticalItems = (element: UsualGroup, configurationSettings: ConfigurationSettings): string[][] => {
  let result: string[][] = []

  if (!element.childItems) return result

  for (const item of element.childItems) {
    const formattedItem = formatElement(item, configurationSettings)
    result.push(addSimpleIndent(formattedItem.strings))
  }
  return result
}
