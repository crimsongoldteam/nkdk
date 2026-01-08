import { formatElementName } from "~/format/helpers"
import { IFormatElementResult } from "~/format/types"
import { ConfigurationContext } from "~/metadata/context/types"
import { getOperationFunction } from "~/metadata/metadataFactory/metadataFactory"
import { BaseElement } from "../../baseElement/types"
import { exportOtherElementToStructure } from "../../baseElement/exportToStructure"
import { UsualGroup } from "../types"

export const formatOneLineGroup = (element: UsualGroup, context: ConfigurationContext): IFormatElementResult => {
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
      const exportFunction = getOperationFunction("ExportToStructure", item.elementType)
      let itemResult: IFormatElementResult
      if (!exportFunction) {
        itemResult = exportOtherElementToStructure(context, item as BaseElement)
      } else {
        itemResult = exportFunction(context, item) as IFormatElementResult
      }
      groupItems.push(itemResult.strings)
    }
  }
  let resultLine = "%" + formatElementName(element) + " " + groupItems.join(separator)

  result.strings.push(resultLine)

  return result
}
