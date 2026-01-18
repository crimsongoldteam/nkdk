import { ConfigurationContext } from "~/metadata/context/types"
import { getOperationFunction } from "~/metadata/metadataFactory/metadataFactory"
import { ButtonGroupChildItems } from "../buttonGroupChildItems/types"
import { ChildItem, ChildItems, ChildItemsPartialEnterprise } from "./types"

export const importChildItemsFromEnterprise = (
  context: ConfigurationContext,
  childItems: ChildItems,
  childItemsProperties?: ChildItemsPartialEnterprise
): ChildItems => {
  return childItems.map((item) => {
    const processedItem = importChildItemProperties(context, item, childItemsProperties)

    // Рекурсивно обрабатываем дочерние элементы
    if ("childItems" in processedItem && processedItem.childItems && processedItem.childItems.length > 0) {
      processedItem.childItems = importChildItemsFromEnterprise(context, processedItem.childItems, childItemsProperties)
    }

    // Рекурсивно обрабатываем элементы командной панели
    if ("autoCommandBar" in processedItem && processedItem.autoCommandBar?.childItems?.length) {
      processedItem.autoCommandBar = {
        ...processedItem.autoCommandBar,
        childItems: importChildItemsFromEnterprise(
          context,
          processedItem.autoCommandBar.childItems,
          childItemsProperties
        ) as ButtonGroupChildItems,
      }
    }

    return processedItem
  })
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
