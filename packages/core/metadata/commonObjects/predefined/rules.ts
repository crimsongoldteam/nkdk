import { predefinedItemCollectionRule } from "../predefinedItem/builders"
import { xmlRootRule } from "../xmlRoot/types"
import type { MetadataItemRule } from "../../orchestration/property/types"
const predefinedRootAttributes = (params: { ownerMetadataItem: unknown }): Record<string, string> => {
  const itemType =
    params.ownerMetadataItem !== null &&
    params.ownerMetadataItem !== undefined &&
    typeof params.ownerMetadataItem === "object"
      ? (
          params.ownerMetadataItem as {
            itemType?: unknown
          }
        ).itemType
      : undefined
  const xsiType =
    itemType === "MetadataChartOfAccounts"
      ? "ChartOfAccountsPredefinedItems"
      : itemType === "MetadataChartOfCharacteristicTypes"
        ? "PlanOfCharacteristicKindPredefinedItems"
        : itemType === "MetadataChartOfCalculationTypes"
          ? "CalculationTypePredefinedItems"
          : "CatalogPredefinedItems"
  return {
    _xmlns: "http://v8.1c.ru/8.3/xcf/predef",
    "_xmlns:v8": "http://v8.1c.ru/8.1/data/core",
    "_xmlns:xr": "http://v8.1c.ru/8.3/xcf/readable",
    "_xmlns:xs": "http://www.w3.org/2001/XMLSchema",
    "_xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
    "_xsi:type": xsiType,
    _version: "2.20",
  }
}
export const PredefinedRules = {
  itemType: "Predefined",
  properties: {
    xmlRoot: xmlRootRule({
      container: "PredefinedData",
      rootAttributes: predefinedRootAttributes,
      forReferenceOnly: true,
      isFileRoot: true,
    }),
    items: predefinedItemCollectionRule({
      // Дочерние <Item>-теги лежат прямо в корне <PredefinedData>, без обёртки <Items>:
      // указание xml="Item" подменяет имя обёртки коллекции на имя её элемента.
      xml: "Item",
      yamlInline: true,
      yaml: "items",
    }),
  },
} as const satisfies MetadataItemRule
