import { uuidPropertyRule } from "~/metadata/commonObjects/uuid/rule"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"

export const AdditionalIndexItemRules = {
  itemType: "AdditionalIndexItem",
  properties: {
    id: {
      ...uuidPropertyRule,
      xml: "_id",
    },
    name: {
      type: "string",
      xml: "Name",
      yaml: "Имя",
      required: true,
    },
    table: {
      type: "string",
      xml: "Table",
      yaml: "Таблица",
    },
    indexedFields: {
      type: "IndexField",
      xml: "IndexedFields",
      yaml: "ИндексируемыеПоля",
    },
    additionalFields: {
      type: "IndexField",
      xml: "AdditionalFields",
      yaml: "ДополнительныеПоля",
    },
  },
} as const satisfies MetadataItemRule

export const AdditionalIndexRules = {
  itemType: "AdditionalIndex",
  properties: {
    xmlRoot: {
      type: "XMLRoot",
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
    },
    items: {
      type: "AdditionalIndexCollection",
      // Дочерние <AdditionalIndex>-теги лежат прямо в корне <AdditionalIndexes>:
      // указание xml="AdditionalIndex" подменяет имя обёртки коллекции на имя её элемента.
      xml: "AdditionalIndex",
      yamlInline: true,
      yaml: "items",
    },
  },
} as const satisfies MetadataItemRule

/**
 * Конверт (envelope) для внешнего XML-файла Ext/AdditionalIndexes.xml.
 *
 * Сохраняется до завершения Phase 5: оркестратор `appliedObject/{convertFromXML,syncToXML}.ts`
 * читает `externalFileEnvelopes`, чтобы понять, как обрабатывать внешние файлы. После Phase 5
 * эти константы удаляются.
 */
export const AdditionalIndexesEnvelope = {
  container: "AdditionalIndexes",
  rootAttributes: AdditionalIndexRules.properties.xmlRoot.rootAttributes,
  childTag: "AdditionalIndex",
} as const
