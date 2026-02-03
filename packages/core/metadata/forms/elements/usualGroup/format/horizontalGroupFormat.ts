import { ConfigurationContext } from "~/metadata/context/types"
import { formatElementName } from "~/metadata/forms/format/helpers"
import { IFormatElementResult } from "~/metadata/forms/format/types"
import { addSimpleIndent } from "~/metadata/forms/format/wrap/addIndents"
import { getOperationFunction } from "~/metadata/metadataFactory/metadataFactory"
import { exportOtherElementToStructure } from "../../baseElement/exportToStructure"
import { NamedElement } from "../../baseElement/types"
import { UsualGroup } from "../types"
import { PropertyRule } from "../../calendarField/rules"

const horizontalGroupPrefix = "%"
const horizontalIfPossibleGroupPrefix = "%#"

export const formatHorizontalGroup = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  element: UsualGroup
): IFormatElementResult => {
  const prefix =
    element.group === undefined || element.group === "HorizontalIfPossible"
      ? horizontalIfPossibleGroupPrefix
      : horizontalGroupPrefix
  let result: IFormatElementResult = {
    strings: [prefix + formatElementName(element)],
    haveSimpleHorizontalGroup: false,
  }

  let verticalGroups: string[][] = getVerticalItems(context, element)

  result.strings.push(...verticalGroups.flat())
  return result
}

const getVerticalItems = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  element: UsualGroup
): string[][] => {
  let result: string[][] = []

  if (!element.childItems) return result

  for (const item of element.childItems) {
    const exportFunction = getOperationFunction("ExportToStructure", item.elementType)
    let formattedItem: IFormatElementResult
    if (!exportFunction) {
      formattedItem = exportOtherElementToStructure(context, item as NamedElement)
    } else {
      formattedItem = exportFunction(context, item) as IFormatElementResult
    }
    result.push(addSimpleIndent(formattedItem.strings))
  }
  return result
}
