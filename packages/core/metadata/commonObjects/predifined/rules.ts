/**
 * Конверт (envelope) для внешнего XML-файла Ext/Predefined.xml,
 * содержащего предопределённые элементы Справочника.
 *
 * container — имя корневого тега XML.
 * rootAttributes — атрибуты корневого тега, подставляемые при экспорте.
 */
export const PredefinedDataEnvelope = {
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
} as const

/**
 * Карта: type → envelope для внешних XML-файлов, используемая оркестраторами.
 */
export const externalFileEnvelopes: Record<string, typeof PredefinedDataEnvelope> = {
  Predefined: PredefinedDataEnvelope,
}
