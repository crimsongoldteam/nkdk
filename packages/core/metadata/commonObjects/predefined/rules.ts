import { MetadataItemRule } from "~/metadata/orchestration/property/types"

export const PredefinedRules = {
  itemType: "Predefined",
  properties: {
    xmlRoot: {
      type: "XMLRoot",
      container: "PredefinedData",
      rootAttributes: {
        _xmlns: "http://v8.1c.ru/8.3/xcf/predef",
        "_xmlns:v8": "http://v8.1c.ru/8.1/data/core",
        "_xmlns:xr": "http://v8.1c.ru/8.3/xcf/readable",
        "_xmlns:xs": "http://www.w3.org/2001/XMLSchema",
        "_xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
        "_xsi:type": "CatalogPredefinedItems",
        _version: "2.20",
      },
      forReferenceOnly: true,
      isFileRoot: true,
    },
    items: {
      type: "PredefinedItemCollection",
      // Дочерние <Item>-теги лежат прямо в корне <PredefinedData>, без обёртки <Items>:
      // указание xml="Item" подменяет имя обёртки коллекции на имя её элемента.
      xml: "Item",
      yamlInline: true,
      yaml: "items",
    },
  },
} as const satisfies MetadataItemRule
