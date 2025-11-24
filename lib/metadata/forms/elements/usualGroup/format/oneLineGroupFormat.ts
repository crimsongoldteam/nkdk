import { formatElement } from "~/lib/format/formatFactory"
import { formatElementName } from "~/lib/format/helpers"
import { IFormatElementResult } from "~/lib/format/types"
import { TConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { TBaseElement } from "../../baseElement/types"
import { TUsualGroup } from "../types"

export const formatOneLineGroup = (
  element: TUsualGroup,
  configurationSettings: TConfigurationSettings
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

  for (const item of element.childItems) {
    const itemResult = formatElement(
      item as TBaseElement,
      configurationSettings
    )
    groupItems.push(itemResult.strings)
  }

  let resultLine =
    "%" + formatElementName(element) + " " + groupItems.join(separator)

  result.strings.push(resultLine)

  return result
}
