import { ConfigurationContext } from "~/metadata/context/types"
import { OtherElement } from "~/metadata/forms/commonObjects/childItems/types"
import { formatElementName, formatElementTitleAndName } from "~/metadata/forms/format/helpers"
import { ToNKDKResult } from "~/metadata/forms/format/types"
import { getElementOperationFunction } from "~/metadata/metadataFactory/elements/elementOperationFactory"
import { exportOtherElementToStructure } from "../../baseElement/exportToStructure"
import { UsualGroup } from "../types"

const horizontalGroupPrefix = "%"
const horizontalIfPossibleGroupPrefix = "%#"
const oneLineGroupSuffix = "%"

export const formatOneLineGroup = (context: ConfigurationContext, element: UsualGroup): ToNKDKResult => {
  const separatorSymbol = ";"
  const separator = separatorSymbol + " "

  let result: ToNKDKResult = []

  let groupItems: ToNKDKResult[] = []

  if (element.childItems) {
    for (const item of element.childItems) {
      const exportFunction = getElementOperationFunction("ExportToStructure", item.itemType)
      let itemResult: ToNKDKResult
      if (!exportFunction) {
        itemResult = exportOtherElementToStructure(context, item as OtherElement)
      } else {
        itemResult = exportFunction(context, item) as ToNKDKResult
      }
      groupItems.push(itemResult)
    }
  }

  const header = formatGroupHeader(context, element)

  const joinedItems = groupItems.map((item) => item.join("")).join(separator)
  const prefix =
    element.group === undefined || element.group === "HorizontalIfPossible"
      ? horizontalIfPossibleGroupPrefix
      : horizontalGroupPrefix
  let resultLine = prefix + header + oneLineGroupSuffix + " " + joinedItems

  result.push(resultLine)

  return result
}

const formatGroupHeader = (context: ConfigurationContext, element: UsualGroup): string => {
  if (element.showTitle === false) {
    return formatElementName(element)
  }

  return formatElementTitleAndName(context, element, true)
}
