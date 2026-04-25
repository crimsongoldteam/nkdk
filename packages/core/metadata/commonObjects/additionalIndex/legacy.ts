/**
 * Legacy-функции для обратной совместимости со старым XML/YAML-кодом
 * (metadataDocument/metadataSequence). После миграции этих объектов
 * на rules.ts файл будет удалён.
 *
 * Касты к `IndexFields` (`string[]`) обходят расхождение между статическим типом
 * `PropertyTypeRegistry["IndexField"].item = string` и фактической runtime-семантикой
 * этого property-типа (массив строк через plural-обработчики). Расхождение исчезнет
 * вместе с этим файлом.
 */
import { importIndexFieldsFromXML } from "~/metadata/commonObjects/indexField/fromXML"
import { exportIndexFieldsToXML } from "~/metadata/commonObjects/indexField/toXML"
import { IndexFields } from "~/metadata/commonObjects/indexField/types"
import { ConfigurationContext, ConfigurationContextFromXML } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { AdditionalIndexes, AdditionalIndexesXML, AdditionalIndexesYAML, AdditionalIndexItem, AdditionalIndexXML } from "./types"

const importAdditionalIndexFromXML = (
  context: ConfigurationContextFromXML,
  xml: AdditionalIndexXML | undefined
): AdditionalIndexItem | undefined => {
  if (!xml) return undefined

  const result = { itemType: "AdditionalIndexItem" } as AdditionalIndexItem

  const additionalFields = importIndexFieldsFromXML(context, undefined, xml.AdditionalFields)
  if (additionalFields !== undefined) result.additionalFields = additionalFields as unknown as AdditionalIndexItem["additionalFields"]

  const indexedFields = importIndexFieldsFromXML(context, undefined, xml.IndexedFields)
  if (indexedFields !== undefined) result.indexedFields = indexedFields as unknown as AdditionalIndexItem["indexedFields"]

  if (xml.Name !== undefined) result.name = xml.Name
  if (xml.Table !== undefined) result.table = xml.Table

  return result
}

export const importAdditionalIndexesFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  xml: AdditionalIndexesXML | undefined
): AdditionalIndexes | undefined => {
  if (!xml) return undefined
  return xml
    .map((value) => importAdditionalIndexFromXML(context, value)!)
    .filter((item): item is AdditionalIndexItem => item !== undefined)
}

const exportAdditionalIndexToYAML = (data: AdditionalIndexItem | undefined) => {
  if (!data) return undefined
  return {
    ДополнительныеПоля: data.additionalFields,
    Имя: data.name,
    ИндексируемыеПоля: data.indexedFields,
    Таблица: data.table,
  }
}

export const exportAdditionalIndexesToYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: AdditionalIndexes | undefined
): AdditionalIndexesYAML | undefined => {
  if (!data) return undefined
  return data.map((value) => exportAdditionalIndexToYAML(value)!) as AdditionalIndexesYAML
}

const exportAdditionalIndexToXML = (
  context: ConfigurationContext,
  data: AdditionalIndexItem | undefined
): AdditionalIndexXML | undefined => {
  if (!data) return undefined
  return {
    Name: data.name,
    Table: data.table,
    IndexedFields: exportIndexFieldsToXML(context, undefined, data.indexedFields as unknown as IndexFields | undefined),
    AdditionalFields: exportIndexFieldsToXML(context, undefined, data.additionalFields as unknown as IndexFields | undefined),
  }
}

export const exportAdditionalIndexesToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: AdditionalIndexes | undefined
): AdditionalIndexesXML | undefined => {
  if (!data || data.length === 0) return undefined
  return data.map((item) => exportAdditionalIndexToXML(context, item)!)
}
