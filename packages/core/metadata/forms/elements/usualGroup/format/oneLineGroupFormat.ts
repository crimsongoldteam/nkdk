import { ConfigurationContext } from "~/metadata/context/types"
import { OtherElement } from "~/metadata/forms/commonObjects/childItems/types"
import { formatElementName, formatElementTitleAndName } from "~/metadata/forms/format/helpers"
import { IFormatElementResult } from "~/metadata/forms/format/types"
import { getElementOperationFunction } from "~/metadata/metadataFactory/elements/elementOperationFactory"
import { exportOtherElementToStructure } from "../../baseElement/exportToStructure"
import { UsualGroup } from "../types"

const horizontalGroupPrefix = "%"
const horizontalIfPossibleGroupPrefix = "%#"
const oneLineGroupSuffix = "%"

export const formatOneLineGroup = (context: ConfigurationContext, element: UsualGroup): IFormatElementResult => {
  const separatorSymbol = ";"
  const separator = separatorSymbol + " "

  let result: IFormatElementResult = {
    strings: [],
    haveSimpleHorizontalGroup: false,
  }

  let groupItems: string[][] = []

  if (element.childItems) {
    for (const item of element.childItems) {
      const exportFunction = getElementOperationFunction("ExportToStructure", item.itemType)
      let itemResult: IFormatElementResult
      if (!exportFunction) {
        itemResult = exportOtherElementToStructure(context, item as OtherElement)
      } else {
        itemResult = exportFunction(context, item) as IFormatElementResult
      }
      groupItems.push(itemResult.strings)
    }
  }

  const header = formatGroupHeader(context, element)

  const joinedItems = groupItems.map((item) => item.join("")).join(separator)
  const prefix =
    element.group === undefined || element.group === "HorizontalIfPossible"
      ? horizontalIfPossibleGroupPrefix
      : horizontalGroupPrefix
  let resultLine = prefix + header + oneLineGroupSuffix + " " + joinedItems

  result.strings.push(resultLine)

  return result
}

const formatGroupHeader = (context: ConfigurationContext, element: UsualGroup): string => {
  if (element.showTitle === false) {
    return formatElementName(element)
  }

  return formatElementTitleAndName(context, element, true)
}
