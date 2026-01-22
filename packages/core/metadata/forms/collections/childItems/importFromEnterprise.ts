import { ConfigurationContext } from "~/metadata/context/types"
import { getOperationFunction } from "~/metadata/metadataFactory/metadataFactory"
import { AllChildItem, AllChildItemsPartialEnterprise, CommandBarChildItem } from "./types"

/**
 * Imports child items partially from enterprise format, processing properties and recursively handling nested child items and command bar items.
 *
 * @param context - The configuration context containing metadata elements
 * @param childItems - Array of child items to process
 * @returns Processed array of child items with imported properties
 */
export const importChildItemsPartialFromEnterprise = <To extends AllChildItem>(
  context: ConfigurationContext,
  childItems: To[]
): To[] => {
  const childItemsProperties = context.allElements!

  return childItems.map((item) => {
    const processedItem = importChildItemProperties(context, item, childItemsProperties)

    // Рекурсивно обрабатываем дочерние элементы
    if ("childItems" in processedItem && processedItem.childItems && processedItem.childItems.length > 0) {
      processedItem.childItems = importChildItemsPartialFromEnterprise(
        context,
        processedItem.childItems as To[]
      ) as typeof processedItem.childItems
    }

    // Рекурсивно обрабатываем элементы командной панели
    if ("autoCommandBar" in processedItem && processedItem.autoCommandBar?.childItems?.length) {
      processedItem.autoCommandBar = {
        ...processedItem.autoCommandBar,
        childItems: importChildItemsPartialFromEnterprise(
          context,
          processedItem.autoCommandBar.childItems as To[]
        ) as CommandBarChildItem[],
      }
    }

    return processedItem
  })
}

/**
 * Imports typed child items from enterprise format, converting a typed object structure into an array of child items.
 *
 * @param context - The configuration context containing metadata elements
 * @param allProperties - Typed enterprise object with child items keyed by name
 * @returns Array of imported child items
 */
// export const importChildItemsTypedFromEnterprise = <To extends ChildItem>(
//   context: ConfigurationContext,
//   allProperties?: AllChildItemsPartialEnterprise
// ): To[] => {
//   if (!allProperties) return []

//   const result: To[] = []
//   for (const [name, item] of Object.entries(allProperties)) {
//     const elementType = importFormElementTypeFromEnterprise(context, item.Тип)
//     const fn = getOperationFunction("ImportTypedFromEnterprise", elementType)
//     if (fn == undefined)
//       throw new Error(`ImportTypedFromEnterprise function not found for element type: ${elementType}`)
//     const resultItem = fn(context, item, name) as NonNullable<To>
//     result.push(resultItem)
//   }
//   return result
// }

const importChildItemProperties = <To extends AllChildItem>(
  context: ConfigurationContext,
  item: To,
  allProperties: AllChildItemsPartialEnterprise
): To => {
  const propertiesEnterprise = allProperties[item.name]

  const fn = getOperationFunction("ImportPartialFromEnterprise", item.elementType)
  if (fn == undefined)
    throw new Error(`ImportPartialFromEnterprise function not found for element type: ${item.elementType}`)
  const result = fn(context, item, propertiesEnterprise)

  return result as To
}
