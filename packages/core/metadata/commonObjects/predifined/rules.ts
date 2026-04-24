import { AdditionalIndexesEnvelope } from "~/metadata/commonObjects/additionalIndex/rules"

/**
 * Конверт (envelope) для внешнего XML-файла Ext/Predefined.xml,
 * содержащего предопределённые элементы Справочника.
 *
 * container — имя корневого тега XML.
 * rootAttributes — атрибуты корневого тега, подставляемые при экспорте.
 * childTag — имя тега дочерних элементов (используется в mergeItemIds; по умолчанию "Item").
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

export interface ExternalFileEnvelope {
  readonly container: string
  readonly rootAttributes: Record<string, string>
  readonly childTag?: string
}

/**
 * Карта: type → envelope для внешних XML-файлов, используемая оркестраторами.
 */
export const externalFileEnvelopes: Record<string, ExternalFileEnvelope> = {
  Predefined: PredefinedDataEnvelope,
  AdditionalIndex: AdditionalIndexesEnvelope,
}
