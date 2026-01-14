import { ConfigurationContext } from "~/metadata/context/types"
import { IFormatElementResult } from "~/metadata/forms/format/types"
import { getOperationFunction } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { exportOtherElementToStructure } from "../../elements/baseElement/exportToStructure"
import { NamedElement } from "../../elements/baseElement/types"
import { ChildItems } from "./types"

export const exportChildItemsToStructure = (context: ConfigurationContext, items: ChildItems): IFormatElementResult => {
  let result: IFormatElementResult = {
    strings: [],
    haveSimpleHorizontalGroup: false,
  }

  const separatedItems: readonly (
    | typeof FormElementType.Pages
    | typeof FormElementType.UsualGroup
    | typeof FormElementType.Table
  )[] = [FormElementType.Pages, FormElementType.UsualGroup, FormElementType.Table]

  let prevItem: NamedElement | null = null
  for (const item of items) {
    if (
      prevItem &&
      (separatedItems.includes(
        item.elementType as
          | typeof FormElementType.Pages
          | typeof FormElementType.UsualGroup
          | typeof FormElementType.Table
      ) ||
        separatedItems.includes(
          prevItem.elementType as
            | typeof FormElementType.Pages
            | typeof FormElementType.UsualGroup
            | typeof FormElementType.Table
        ))
    ) {
      result.strings.push("")
    }

    prevItem = item

    const exportFunction = getOperationFunction("ExportToStructure", item.elementType)

    const text = exportFunction
      ? (exportFunction(context, item) as IFormatElementResult)
      : exportOtherElementToStructure(context, item)

    result.strings.push(...text.strings)
    result.haveSimpleHorizontalGroup = result.haveSimpleHorizontalGroup || text.haveSimpleHorizontalGroup
  }
  return result
}
