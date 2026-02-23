import { ConfigurationContext } from "~/metadata/context/types"
import { OtherElement } from "~/metadata/forms/commonObjects/childItems/types"
import { formatElementName } from "~/metadata/forms/format/helpers"
import { ToNKDKResult } from "~/metadata/forms/format/types"
import { addSimpleIndent } from "~/metadata/forms/format/wrap/addIndents"
import { getElementOperationFunction } from "~/metadata/metadataFactory/elements/elementOperationFactory"
import { exportOtherElementToStructure } from "../../baseElement/exportToStructure"
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
    haveSimpleHorizontalGroup: false,
  }

  let verticalGroups: ToNKDKResult[] = getVerticalItems(context, element)

  result.push(...verticalGroups.flat())
  return result
}

const getVerticalItems = (context: ConfigurationContext, element: UsualGroup): string[][] => {
  let result: string[][] = []

  if (!element.childItems) return result

  for (const item of element.childItems) {
    const exportFunction = getElementOperationFunction("ExportToStructure", item.itemType)
    let formattedItem: ToNKDKResult
    if (!exportFunction) {
      formattedItem = exportOtherElementToStructure(context, item as OtherElement)
    } else {
      formattedItem = exportFunction(context, item) as ToNKDKResult
    }
    result.push(addSimpleIndent(formattedItem))
  }
  return result
}
