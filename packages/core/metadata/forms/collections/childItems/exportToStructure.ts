import { ConfigurationContext } from "~/metadata/context/types"
import { IFormatElementResult } from "~/metadata/forms/format/types"
import { getOperationFunction } from "~/metadata/metadataFactory/metadataFactory"
import { exportOtherElementToStructure } from "../../elements/baseElement/exportToStructure"
import { AllChildItem } from "./types"

export const exportChildItemsToStructure = <From extends AllChildItem>(
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  items: From[]
): IFormatElementResult => {
  let result: IFormatElementResult = {
    strings: [],
    haveSimpleHorizontalGroup: false,
  }

  // const separatedItems: readonly (
  //   | typeof FormElementType.Pages
  //   | typeof FormElementType.UsualGroup
  //   | typeof FormElementType.Table
  // )[] = [FormElementType.Pages, FormElementType.UsualGroup, FormElementType.Table]

  // let prevItem: NamedElement | null = null
  for (const item of items) {
    //   if (
    //     prevItem &&
    //     (separatedItems.includes(
    //       item.elementType as
    //         | typeof FormElementType.Pages
    //         | typeof FormElementType.UsualGroup
    //         | typeof FormElementType.Table
    //     ) ||
    //       separatedItems.includes(
    //         prevItem.elementType as
    //           | typeof FormElementType.Pages
    //           | typeof FormElementType.UsualGroup
    //           | typeof FormElementType.Table
    //       ))
    //   ) {
    //     result.strings.push("")
    //   }

    //   prevItem = item

    const exportFunction = getOperationFunction("ExportToStructure", item.elementType)

    const text = exportFunction
      ? (exportFunction(context, item) as IFormatElementResult)
      : exportOtherElementToStructure(context, item)

    result.strings.push(...text.strings)
    result.haveSimpleHorizontalGroup = result.haveSimpleHorizontalGroup || text.haveSimpleHorizontalGroup
  }
  return result
}
