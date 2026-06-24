/**
 * Конверт (envelope) для внешнего XML-файла Ext/Help.xml,
 * содержащего список языков справки объекта метаданных.
 *
 * container — имя корневого тега XML.
 * rootAttributes — атрибуты корневого тега, подставляемые при экспорте.
 */
export const HelpEnvelope = {
  container: "Help",
  rootAttributes: {
    _xmlns: "http://v8.1c.ru/8.3/xcf/extrnprops",
    "_xmlns:xs": "http://www.w3.org/2001/XMLSchema",
    "_xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
    _version: "2.20",
  },
} as const
