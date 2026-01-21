import { ConfigurationContext } from "~/metadata/context/types"
import { formatElementName, formatElementTitleAndName } from "~/metadata/forms/format/helpers"
import { IFormatElementResult } from "~/metadata/forms/format/types"
import { getOperationFunction } from "~/metadata/metadataFactory/metadataFactory"
import { exportOtherElementToStructure } from "../../baseElement/exportToStructure"
import { NamedElement } from "../../baseElement/types"
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
        itemResult = exportOtherElementToStructure(context, item as NamedElement)
      } else {
        itemResult = exportFunction(context, item) as IFormatElementResult
      }
      groupItems.push(itemResult.strings)
    }
  }

  const header = formatGroupHeader(context, element)

  const joinedItems = groupItems.map((item) => item.join("")).join(separator)
  const prefix = element.group === undefined ? horizontalIfPossibleGroupPrefix : horizontalGroupPrefix
  let resultLine = prefix + header + oneLineGroupSuffix + " " + joinedItems

  result.strings.push(resultLine)

  return result
}

const formatGroupHeader = (context: ConfigurationContext, element: UsualGroup): string => {
  if (element.showTitle === false) {
    return formatElementName(element)
  }

  return formatElementTitleAndName(context, element)
}
