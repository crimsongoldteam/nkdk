import { additionalIndexCollectionRule } from "./builders"
import { indexFieldRule } from "../indexField/types"
import { stringRule } from "../string/types"
import { xmlRootRule } from "../xmlRoot/types"
import { uuidPropertyRule } from "../uuid/rule"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
export const AdditionalIndexItemRules = {
  itemType: "AdditionalIndexItem",
  xmlOrder: [
    "name",
    "table",
    "indexedFields",
    "additionalFields",
    "id",
  ],
  properties: {
    id: {
      ...uuidPropertyRule,
      xml: "_id",
    },
    additionalFields: indexFieldRule({
      xml: "AdditionalFields",
      yaml: "ДополнительныеПоля",
      defaultValueXMLRaw: {},
    }),
    name: stringRule({
      xml: "Name",
      yaml: "Имя",
      required: true,
    }),
    indexedFields: indexFieldRule({
      xml: "IndexedFields",
      yaml: "ИндексируемыеПоля",
    }),
    table: stringRule({
      xml: "Table",
      yaml: "Таблица",
    }),
  },
} as const satisfies MetadataItemRule
export const AdditionalIndexRules = {
  itemType: "AdditionalIndex",
  xmlOrder: [
    "items",
  ],
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
