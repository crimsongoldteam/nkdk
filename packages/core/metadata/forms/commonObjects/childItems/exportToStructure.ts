import { ConfigurationContext } from "~/metadata/context/types"
import { ToNKDKResult } from "~/metadata/forms/format/types"
import { getElementOperationFunction } from "~/metadata/metadataFactory/elements/elementOperationFactory"
import { exportOtherElementToStructure } from "../../elements/baseElement/exportToStructure"
import { AllChildItem, OtherElement } from "./types"

export const exportChildItemsToStructure = <From extends AllChildItem>(
  context: ConfigurationContext,
  items: From[]
): ToNKDKResult => {
  let   let result: ToNKDKResult = []

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
    //     result.push("")
    //   }

    //   prevItem = item

    const exportFunction = getElementOperationFunction("ExportToStructure", item.itemType)

    const text = exportFunction
      ? (exportFunction(context, item) as ToNKDKResult)
      : exportOtherElementToStructure(context, item as OtherElement)

    result.push(...text)
  }
  return result
}
