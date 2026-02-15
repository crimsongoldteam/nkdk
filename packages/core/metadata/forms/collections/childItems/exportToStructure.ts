import { ConfigurationContext } from "~/metadata/context/types"
import { IFormatElementResult } from "~/metadata/forms/format/types"
import { getOperationFunction } from "~/metadata/metadataFactory/metadataFactory"
import { exportOtherElementToStructure } from "../../elements/baseElement/exportToStructure"
import { AllChildItem } from "./types"

export const exportChildItemsToStructure = <From extends AllChildItem>(
  context: ConfigurationContext,
  items: From[]
): IFormatElementResult => {
  let result: IFormatElementResult = {
    strings: [],
    haveSimpleHorizontalGroup: false,
  }

  // const separatedItems: readonly (
  //   | typeof CollectionFormElementType.Pages
  //   | typeof CollectionFormElementType.UsualGroup
  //   | typeof CollectionFormElementType.Table
  // )[] = [CollectionFormElementType.Pages, CollectionFormElementType.UsualGroup, CollectionFormElementType.Table]

  // let prevItem: NamedElement | null = null
  for (const item of items) {
    //   if (
    //     prevItem &&
    //     (separatedItems.includes(
    //       item.itemType as
    //         | typeof CollectionFormElementType.Pages
    //         | typeof CollectionFormElementType.UsualGroup
    //         | typeof CollectionFormElementType.Table
    //     ) ||
    //       separatedItems.includes(
    //         prevItem.itemType as
    //           | typeof CollectionFormElementType.Pages
    //           | typeof CollectionFormElementType.UsualGroup
    //           | typeof CollectionFormElementType.Table
    //       ))
    //   ) {
    //     result.strings.push("")
    //   }

    //   prevItem = item

    const exportFunction = getOperationFunction("ExportToStructure", item.itemType)

    const text = exportFunction
      ? (exportFunction(context, item) as IFormatElementResult)
      : exportOtherElementToStructure(context, item)

    result.strings.push(...text.strings)
    result.haveSimpleHorizontalGroup = result.haveSimpleHorizontalGroup || text.haveSimpleHorizontalGroup
  }
  return result
}
