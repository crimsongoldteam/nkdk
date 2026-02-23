import { ConfigurationContext } from "~/metadata/context/types"
import { OtherElement } from "~/metadata/forms/commonObjects/childItems/types"
import { formatElementName } from "~/metadata/forms/format/helpers"
import { addSimpleIndent } from "~/metadata/forms/format/wrap/addIndents"
import { getElementOperationFunction } from "~/metadata/metadataFactory/elements/elementOperationFactory"
import { ToNKDKResult } from "~/metadata/metadataFactory/elements/toNKDKGenerator/types"
import { exportOtherElementToNKDK } from "../../baseElement/exportToStructure"
import { UsualGroup } from "../types"

const horizontalGroupPrefix = "%"
const horizontalIfPossibleGroupPrefix = "%#"

export const formatHorizontalGroup = (context: ConfigurationContext, element: UsualGroup): ToNKDKResult => {
  const prefix =
    element.group === undefined || element.group === "HorizontalIfPossible"
      ? horizontalIfPossibleGroupPrefix
      : horizontalGroupPrefix
  let result: ToNKDKResult = {
    strings: [prefix + formatElementName(element)],
    toOneLineGroup: false,
  }

  let verticalGroups: string[][] = getVerticalItems(context, element)

  result.strings.push(...verticalGroups.flat())
  return result
}

const getVerticalItems = (context: ConfigurationContext, element: UsualGroup): string[][] => {
  let result: string[][] = []

  if (!element.childItems) return result

  for (const item of element.childItems) {
    const exportFunction = getElementOperationFunction("ExportToStructure", item.itemType)
    let formattedItem: ToNKDKResult
    if (!exportFunction) {
      formattedItem = exportOtherElementToNKDK(context, item as OtherElement)
    } else {
      formattedItem = exportFunction(context, item) as ToNKDKResult
    }
    result.push(addSimpleIndent(formattedItem.strings))
  }
  return result
}
