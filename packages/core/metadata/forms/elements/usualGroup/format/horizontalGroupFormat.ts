import { formatElementName } from "~/format/helpers"
import { IFormatElementResult } from "~/format/types"
import { addSimpleIndent } from "~/format/wrap/addIndents"
import { ConfigurationContext } from "~/metadata/context/types"
import { getOperationFunction } from "~/metadata/metadataFactory/metadataFactory"
import { exportOtherElementToStructure } from "../../baseElement/exportToStructure"
import { BaseElement } from "../../baseElement/types"
import { UsualGroup } from "../types"

export const formatHorizontalGroup = (context: ConfigurationContext, element: UsualGroup): IFormatElementResult => {
  let result: IFormatElementResult = {
    strings: ["%" + formatElementName(element)],
    haveSimpleHorizontalGroup: false,
  }

  let verticalGroups: string[][] = getVerticalItems(context, element)

  result.strings.push(...verticalGroups.flat())
  return result
}

const getVerticalItems = (context: ConfigurationContext, element: UsualGroup): string[][] => {
  let result: string[][] = []

  if (!element.childItems) return result

  for (const item of element.childItems) {
    const exportFunction = getOperationFunction("ExportToStructure", item.elementType)
    let formattedItem: IFormatElementResult
    if (!exportFunction) {
      formattedItem = exportOtherElementToStructure(context, item as BaseElement)
    } else {
      formattedItem = exportFunction(context, item) as IFormatElementResult
    }
    result.push(addSimpleIndent(formattedItem.strings))
  }
  return result
}
