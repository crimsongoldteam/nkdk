import { ConfigurationContext } from "~/metadata/context/types"
import { executeImportPartialFromEnterpriseOperation } from "~/metadata/metadataFactory/metadataFactory"
import { ChildItem, ChildItems, ChildItemsPartialEnterprise } from "./types"

export const importChildItemsPropertiesFromEnterprise = (
  context: ConfigurationContext,
  childItems: ChildItems,
  childItemsProperties?: ChildItemsPartialEnterprise
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
  childItemsProperties?: ChildItemsPartialEnterprise
): ChildItem => {
  if (!childItemsProperties) return { ...item }

  const propertiesEnterprise = childItemsProperties[item.name]

  const result = executeImportPartialFromEnterpriseOperation(
    "ImportPartialFromEnterprise",
    item.elementType,
    context,
    item,
    propertiesEnterprise
  )

  return result
}
