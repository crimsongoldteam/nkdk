import { parseBoolean } from "~/lib/metadata/commonObjects/boolean/importFromEnterprise"
import { parseI8nText } from "~/lib/metadata/commonObjects/i8nText/importFromEnterprise"
import {
  MetadataAttribute,
  MetadataAttributeEnterprise,
  MetadataAttributes,
  MetadataAttributesEnterprise,
} from "~/lib/metadata/commonObjects/metadataAttribute/types"
import { importTypeDescriptionFromEnterprise } from "~/lib/metadata/commonObjects/typeDescription/importFromEnterprise"
import { Context } from "~/lib/metadata/context/types"
import { compactObject, removeDefaults } from "~/lib/metadata/helpers/compactObject"
import { importSystemEnumerationFromEnterprise } from "~/lib/metadata/systemEnumerations/importFromEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { isSynonymEqualToName } from "../../helpers/isSynonymEqualToName"
import { getDefaults } from "./defaults"

const importMetadataValueFromEnterprise = (
  _configurationSettings: Context,
  data: { Тип: string; Значение: string } | undefined
): { type: string; value: string } | undefined => {
  if (!data) return undefined

  return {
    type: data.Тип,
    value: data.Значение,
  }
}

const importTypeLinkFromEnterprise = (
  _configurationSettings: Context,
  value: string | undefined
): { dataPath: string; linkItem: string | number } | undefined => {
  if (!value) return undefined

  // TODO: Реализовать парсинг строки в TypeLink
  return undefined
}

const importChoiceParameterLinksFromEnterprise = (
  _configurationSettings: Context,
  value: string | undefined
): Array<{ name: string; dataPath: string; valueChange?: string }> | undefined => {
  if (!value) return undefined

  // TODO: Реализовать парсинг строки в ChoiceParameterLinks
  return undefined
}

export const importMetadataAttributeFromEnterprise = (
  configurationSettings: Context,
  data: MetadataAttributeEnterprise | undefined,
  name: string
): MetadataAttribute | undefined => {
  if (!data) return undefined

  const removeDefaultQualifiers = (type: ReturnType<typeof importTypeDescriptionFromEnterprise>) => {
    if (!type) return type

    const result = { ...type }

    // Удаляем stringQualifiers, если они равны дефолтным значениям
    if (
      result.stringQualifiers &&
      result.stringQualifiers.length === 0 &&
      result.stringQualifiers.allowedLength === "Variable"
    ) {
      result.stringQualifiers = undefined
    }

    // Удаляем numberQualifiers, если они равны дефолтным значениям
    if (
      result.numberQualifiers &&
      result.numberQualifiers.digits === 0 &&
      result.numberQualifiers.fractionDigits === 0 &&
      result.numberQualifiers.allowedSign === undefined
    ) {
      result.numberQualifiers = undefined
    }

    // Удаляем dateQualifiers, если они равны дефолтным значениям
    if (result.dateQualifiers && result.dateQualifiers.dateFractions === "Date") {
      result.dateQualifiers = undefined
    }

    return compactObject(result)
  }

  // Если data - строка, это короткий формат (только тип)
  if (typeof data === "string") {
    const type = importTypeDescriptionFromEnterprise(configurationSettings, data)
    if (!type) return undefined

    const compactedType = removeDefaultQualifiers(type)

    return {
      name,
      type: compactedType,
    }
  }

  // Полный формат - объект
  const type = importTypeDescriptionFromEnterprise(configurationSettings, data.Тип)
  if (!type) return undefined

  const compactedType = removeDefaultQualifiers(type)

  const synonym = parseI8nText(data.Синоним, configurationSettings)
  const excludeSynonym = isSynonymEqualToName(typeof data.Синоним === "string" ? data.Синоним : undefined, name)

  const result: MetadataAttribute = {
    name,
    type: compactedType,
    synonym: excludeSynonym ? undefined : synonym,
    quickChoice: importSystemEnumerationFromEnterprise(
      configurationSettings,
      data.БыстрыйВыбор,
      SE.UseQuickChoiceFromEnterprise
    ),
    choiceFoldersAndItems: importSystemEnumerationFromEnterprise(
      configurationSettings,
      data.ВыборГруппИЭлементов,
      SE.FoldersAndItemsUseFromEnterprise
    ),
    markNegatives: parseBoolean(data.ВыделятьОтрицательные, configurationSettings),
    fillFromFillingValue: parseBoolean(data.ЗаполнятьИзДанныхЗаполнения, configurationSettings),
    fillingValue: importMetadataValueFromEnterprise(configurationSettings, data.ЗначениеЗаполнения),
    indexing: importSystemEnumerationFromEnterprise(
      configurationSettings,
      data.Индексирование,
      SE.IndexingFromEnterprise
    ),
    use: importSystemEnumerationFromEnterprise(
      configurationSettings,
      data.Использование,
      SE.AttributeUseFromEnterprise
    ),
    binaryDataStorageLocationUse: importSystemEnumerationFromEnterprise(
      configurationSettings,
      data.ИспользованиеХраненияВХранилищеДвоичныхДанных,
      SE.BinaryDataStorageLocationUseFromEnterprise
    ),
    choiceHistoryOnInput: importSystemEnumerationFromEnterprise(
      configurationSettings,
      data.ИсторияВыбораПриВводе,
      SE.ChoiceHistoryOnInputFromEnterprise
    ),
    dataHistory: importSystemEnumerationFromEnterprise(
      configurationSettings,
      data.ИсторияДанных,
      SE.DataHistoryUseFromEnterprise
    ),
    comment: data.Комментарий,
    maxValue: data.МаксимальноеЗначение,
    mask: data.Маска,
    minValue: data.МинимальноеЗначение,
    multiLine: parseBoolean(data.МногострочныйРежим, configurationSettings),
    choiceParameters: importChoiceParameterLinksFromEnterprise(configurationSettings, data.ПараметрыВыбора),
    tooltip: parseI8nText(data.Подсказка, configurationSettings),
    binaryDataStorageLocationUseField: parseBoolean(
      data.ПолеИспользованияХраненияВХранилищеДвоичныхДанных,
      configurationSettings
    ),
    fullTextSearch: importSystemEnumerationFromEnterprise(
      configurationSettings,
      data.ПолнотекстовыйПоиск,
      SE.UseFullTextSearchFromEnterprise
    ),
    objectBelonging: importSystemEnumerationFromEnterprise(
      configurationSettings,
      data.ПринадлежностьОбъекта,
      SE.ObjectBelongingFromEnterprise
    ),
    fillChecking: importSystemEnumerationFromEnterprise(
      configurationSettings,
      data.ПроверкаЗаполнения,
      SE.FillCheckingFromEnterprise
    ),
    extendedEdit: parseBoolean(data.РасширенноеРедактирование, configurationSettings),
    passwordMode: parseBoolean(data.РежимПароля, configurationSettings),
    choiceParameterLinks: importChoiceParameterLinksFromEnterprise(configurationSettings, data.СвязиПараметровВыбора),
    linkByType: importTypeLinkFromEnterprise(configurationSettings, data.СвязьПоТипу),
    createOnInput: importSystemEnumerationFromEnterprise(
      configurationSettings,
      data.СозданиеПриВводе,
      SE.CreateOnInputFromEnterprise
    ),
    choiceForm: data.ФормаВыбора,
    format: parseI8nText(data.Формат, configurationSettings),
    editFormat: parseI8nText(data.ФорматРедактирования, configurationSettings),
  }

  const compactedResult = compactObject(result)
  const defaults = getDefaults(compactedResult, configurationSettings)
  return removeDefaults(compactedResult, defaults)
}

export const importMetadataAttributesFromEnterprise = (
  configurationSettings: Context,
  data: MetadataAttributesEnterprise | undefined
): MetadataAttributes | undefined => {
  if (!data) return undefined

  return Object.entries(data)
    .map(([name, value]) => importMetadataAttributeFromEnterprise(configurationSettings, value, name))
    .filter((item): item is MetadataAttribute => item !== undefined)
}
