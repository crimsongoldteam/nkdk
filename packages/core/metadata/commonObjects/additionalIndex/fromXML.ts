import {
  AdditionalIndex,
  AdditionalIndexes,
  AdditionalIndexesXML,
  AdditionalIndexXML,
} from "~/metadata/commonObjects/additionalIndex/types"
import { importIndexFieldsFromXML } from "~/metadata/commonObjects/indexField/fromXML"
import { ConfigurationContextFromXML } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/orchestration"

export const importAdditionalIndexFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  xml: AdditionalIndexXML | undefined
): AdditionalIndex | undefined => {
  if (!xml) return undefined

  const result: AdditionalIndex = {}

  const additionalFields = importIndexFieldsFromXML(context, undefined, xml.AdditionalFields)
  if (additionalFields !== undefined) result.additionalFields = additionalFields

  const indexedFields = importIndexFieldsFromXML(context, undefined, xml.IndexedFields)
  if (indexedFields !== undefined) result.indexedFields = indexedFields

  if (xml.Name !== undefined) result.name = xml.Name
  if (xml.Table !== undefined) result.table = xml.Table

  return result
}

/**
 * Обработчик importFromXML для типа "AdditionalIndex".
 * Получает содержимое контейнера (содержимое тега <AdditionalIndexes>):
 * { AdditionalIndex: AdditionalIndexXML | AdditionalIndexXML[] }
 */
export const importAdditionalIndexesFromContainerXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  containerContent: Record<string, any> | undefined
): AdditionalIndexes | undefined => {
  if (!containerContent) return undefined
  const rawItems = containerContent.AdditionalIndex
  if (rawItems === undefined) return []
  const items: AdditionalIndexXML[] = Array.isArray(rawItems) ? rawItems : [rawItems]
  return items.map((item) => importAdditionalIndexFromXML(context, undefined, item)!).filter(Boolean)
}

registerTypeRule("AdditionalIndex", "importFromXML", importAdditionalIndexesFromContainerXML)

/**
 * Устаревшая функция для кода, читающего AdditionalIndexes из массива (основной XML).
 * Используется metadataDocument/fromXML.ts до его перехода на filePath-механизм.
 */
export const importAdditionalIndexesFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  xml: AdditionalIndexesXML | undefined
): AdditionalIndexes | undefined => {
  if (!xml) return undefined
  return xml.map((value: AdditionalIndexXML) => importAdditionalIndexFromXML(context, undefined, value)!).filter(Boolean)
}
