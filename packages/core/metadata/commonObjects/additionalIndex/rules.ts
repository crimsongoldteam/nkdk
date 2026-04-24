/**
 * Конверт (envelope) для внешнего XML-файла Ext/AdditionalIndexes.xml,
 * содержащего дополнительные индексы объекта метаданных.
 *
 * container — имя корневого тега XML.
 * rootAttributes — атрибуты корневого тега, подставляемые при экспорте.
 * childTag — имя тега дочерних элементов (используется в mergeItemIds).
 */
export const AdditionalIndexesEnvelope = {
  container: "AdditionalIndexes",
  rootAttributes: {
    _xmlns: "http://v8.1c.ru/8.3/xcf/extrnprops",
    "_xmlns:v8": "http://v8.1c.ru/8.1/data/core",
    "_xmlns:xr": "http://v8.1c.ru/8.3/xcf/readable",
    "_xmlns:xs": "http://www.w3.org/2001/XMLSchema",
    "_xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
    _version: "2.20",
  },
  childTag: "AdditionalIndex",
} as const
