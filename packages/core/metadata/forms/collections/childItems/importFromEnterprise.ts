import { ConfigurationContext } from "~/metadata/context/types"
import { getOperationFunction } from "~/metadata/metadataFactory/metadataFactory"
import { importFormElementTypeFromEnterprise } from "~/metadata/metadataFactory/types"
import { CommandBarChildItems } from "../commandBarChildItems/types"
import { ChildItem, ChildItems, ChildItemsPartialEnterprise, ChildItemsTypedEnterprise } from "./types"

export const importChildItemsPartialFromEnterprise = (
  context: ConfigurationContext,
  childItems: ChildItems
): ChildItems => {
  const childItemsProperties = context.allElements!

  return childItems.map((item) => {
    const processedItem = importChildItemProperties(context, item, childItemsProperties)

    // Рекурсивно обрабатываем дочерние элементы
    if ("childItems" in processedItem && processedItem.childItems && processedItem.childItems.length > 0) {
      processedItem.childItems = importChildItemsPartialFromEnterprise(context, processedItem.childItems)
    }

    // Рекурсивно обрабатываем элементы командной панели
    if ("autoCommandBar" in processedItem && processedItem.autoCommandBar?.childItems?.length) {
      processedItem.autoCommandBar = {
        ...processedItem.autoCommandBar,
        childItems: importChildItemsPartialFromEnterprise(
          context,
          processedItem.autoCommandBar.childItems
        ) as CommandBarChildItems,
      }
    }

    return processedItem
  })
}

export const importChildItemsTypedFromEnterprise = (
  context: ConfigurationContext,
  childItems: ChildItemsTypedEnterprise
): ChildItems => {
  const result: ChildItems = []
  for (const [name, item] of Object.entries(childItems)) {
    const elementType = importFormElementTypeFromEnterprise(context, item.Тип)
    const fn = getOperationFunction("ImportTypedFromEnterprise", elementType)
    if (fn == undefined) throw new Error(`Import function not found for element type: ${elementType}`)
    const resultItem = fn(context, item, name) as ChildItem
    result.push(resultItem)
  }
  return result
}

const importChildItemProperties = (
  context: ConfigurationContext,
  item: ChildItem,
  childItemsProperties?: ChildItemsPartialEnterprise
): ChildItem => {
  if (!childItemsProperties) return { ...item }

  const propertiesEnterprise = childItemsProperties[item.name]

  const fn = getOperationFunction("ImportPartialFromEnterprise", item.elementType)
  if (fn == undefined) throw new Error(`Import function not found for element type: ${item.elementType}`)
  const result = fn(context, item, propertiesEnterprise) as ChildItem

  return result
}
