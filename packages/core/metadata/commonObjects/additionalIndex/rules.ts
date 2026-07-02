import { additionalIndexCollectionRule } from "~/metadata/commonObjects/additionalIndex/builders"
import { indexFieldRule } from "~/metadata/commonObjects/indexField/types"
import { stringRule } from "~/metadata/commonObjects/string/types"
import { xmlRootRule } from "~/metadata/commonObjects/xmlRoot/types"
import { uuidPropertyRule } from "~/metadata/commonObjects/uuid/rule"
import type { MetadataItemRule } from "~/metadata/orchestration/property/types"
export const AdditionalIndexItemRules = {
  itemType: "AdditionalIndexItem",
  properties: {
    id: {
      ...uuidPropertyRule,
      xml: "_id",
    },
    additionalFields: indexFieldRule({
      xml: "AdditionalFields",
      yaml: "ДополнительныеПоля",
      order: 4,
    }),
    name: stringRule({
      xml: "Name",
      yaml: "Имя",
      required: true,
      order: 1,
    }),
    indexedFields: indexFieldRule({
      xml: "IndexedFields",
      yaml: "ИндексируемыеПоля",
      order: 3,
    }),
    table: stringRule({
      xml: "Table",
      yaml: "Таблица",
      order: 2,
    }),
  },
} as const satisfies MetadataItemRule
export const AdditionalIndexRules = {
  itemType: "AdditionalIndex",
  properties: {
    xmlRoot: xmlRootRule({
      container: "AdditionalIndexes",
      rootAttributes: {
        _xmlns: "http://v8.1c.ru/8.3/xcf/extrnprops",
        "_xmlns:v8": "http://v8.1c.ru/8.1/data/core",
        "_xmlns:xr": "http://v8.1c.ru/8.3/xcf/readable",
        "_xmlns:xs": "http://www.w3.org/2001/XMLSchema",
        "_xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
        _version: "2.20",
      },
      forReferenceOnly: true,
      isFileRoot: true,
    }),
    items: additionalIndexCollectionRule({
      // Дочерние <AdditionalIndex>-теги лежат прямо в корне <AdditionalIndexes>:
      // указание xml="AdditionalIndex" подменяет имя обёртки коллекции на имя её элемента.
      xml: "AdditionalIndex",
      yamlInline: true,
      yaml: "items",
    }),
  },
} as const satisfies MetadataItemRule
