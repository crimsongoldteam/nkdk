import { ConfigurationContext } from "~/metadata/context/types"
import { executeOperation } from "~/metadata/metadataFactory/metadataFactory"
import { ChildItem, ChildItems, ChildItemsEnterprise } from "./types"

export const importChildItemsPropertiesFromEnterprise = (
  context: ConfigurationContext,
  childItems: ChildItems,
  childItemsProperties?: ChildItemsEnterprise
): ChildItems => {
  return childItems.map((item) => {
    const processedItem = importChildItemProperties(context, item, childItemsProperties)

    // Рекурсивно обрабатываем дочерние элементы
    if ("childItems" in processedItem && processedItem.childItems && processedItem.childItems.length > 0) {
      processedItem.childItems = importChildItemsPropertiesFromEnterprise(
        context,
        processedItem.childItems,
        childItemsProperties
      )
    }

    return processedItem
  })
}

const importChildItemProperties = (
  context: ConfigurationContext,
  item: ChildItem,
  childItemsProperties?: ChildItemsEnterprise
): ChildItem => {
  if (!childItemsProperties) return { ...item }

  const propertiesEnterprise = childItemsProperties[item.name]

  const properties = executeOperation(
    "ImportFromEnterprise",
    item.elementType,
    propertiesEnterprise,
    context,
    item.name
  )

  if (!properties) return { ...item }
  return { ...item, ...properties }
}
