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
  _context: Context,
  data: { Тип: string; Значение: string } | undefined
): { type: string; value: string } | undefined => {
  if (!data) return undefined

  return {
    type: data.Тип,
    value: data.Значение,
  }
}

const importTypeLinkFromEnterprise = (
  _context: Context,
  value: string | undefined
): { dataPath: string; linkItem: string | number } | undefined => {
  if (!value) return undefined

  // TODO: Реализовать парсинг строки в TypeLink
  return undefined
}

const importChoiceParameterLinksFromEnterprise = (
  _context: Context,
  value: string | undefined
): Array<{ name: string; dataPath: string; valueChange?: string }> | undefined => {
  if (!value) return undefined

  // TODO: Реализовать парсинг строки в ChoiceParameterLinks
  return undefined
}

export const importMetadataAttributeFromEnterprise = (
  context: Context,
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
    const type = importTypeDescriptionFromEnterprise(context, data)
    if (!type) return undefined

    const compactedType = removeDefaultQualifiers(type)

    return {
      name,
      type: compactedType,
    }
  }

  // Полный формат - объект
  const type = importTypeDescriptionFromEnterprise(context, data.Тип)
  if (!type) return undefined

  const compactedType = removeDefaultQualifiers(type)

  const synonym = parseI8nText(data.Синоним, context)
  const excludeSynonym = isSynonymEqualToName(typeof data.Синоним === "string" ? data.Синоним : undefined, name)

  const result: MetadataAttribute = {
    name,
    type: compactedType,
    synonym: excludeSynonym ? undefined : synonym,
    quickChoice: importSystemEnumerationFromEnterprise(context, data.БыстрыйВыбор, SE.UseQuickChoiceFromEnterprise),
    choiceFoldersAndItems: importSystemEnumerationFromEnterprise(
      context,
      data.ВыборГруппИЭлементов,
      SE.FoldersAndItemsUseFromEnterprise
    ),
    markNegatives: parseBoolean(data.ВыделятьОтрицательные, context),
    fillFromFillingValue: parseBoolean(data.ЗаполнятьИзДанныхЗаполнения, context),
    fillingValue: importMetadataValueFromEnterprise(context, data.ЗначениеЗаполнения),
    indexing: importSystemEnumerationFromEnterprise(context, data.Индексирование, SE.IndexingFromEnterprise),
    use: importSystemEnumerationFromEnterprise(context, data.Использование, SE.AttributeUseFromEnterprise),
    binaryDataStorageLocationUse: importSystemEnumerationFromEnterprise(
      context,
      data.ИспользованиеХраненияВХранилищеДвоичныхДанных,
      SE.BinaryDataStorageLocationUseFromEnterprise
    ),
    choiceHistoryOnInput: importSystemEnumerationFromEnterprise(
      context,
      data.ИсторияВыбораПриВводе,
      SE.ChoiceHistoryOnInputFromEnterprise
    ),
    dataHistory: importSystemEnumerationFromEnterprise(context, data.ИсторияДанных, SE.DataHistoryUseFromEnterprise),
    comment: data.Комментарий,
    maxValue: data.МаксимальноеЗначение,
    mask: data.Маска,
    minValue: data.МинимальноеЗначение,
    multiLine: parseBoolean(data.МногострочныйРежим, context),
    choiceParameters: importChoiceParameterLinksFromEnterprise(context, data.ПараметрыВыбора),
    tooltip: parseI8nText(data.Подсказка, context),
    binaryDataStorageLocationUseField: parseBoolean(data.ПолеИспользованияХраненияВХранилищеДвоичныхДанных, context),
    fullTextSearch: importSystemEnumerationFromEnterprise(
      context,
      data.ПолнотекстовыйПоиск,
      SE.UseFullTextSearchFromEnterprise
    ),
    objectBelonging: importSystemEnumerationFromEnterprise(
      context,
      data.ПринадлежностьОбъекта,
      SE.ObjectBelongingFromEnterprise
    ),
    fillChecking: importSystemEnumerationFromEnterprise(
      context,
      data.ПроверкаЗаполнения,
      SE.FillCheckingFromEnterprise
    ),
    extendedEdit: parseBoolean(data.РасширенноеРедактирование, context),
    passwordMode: parseBoolean(data.РежимПароля, context),
    choiceParameterLinks: importChoiceParameterLinksFromEnterprise(context, data.СвязиПараметровВыбора),
    linkByType: importTypeLinkFromEnterprise(context, data.СвязьПоТипу),
    createOnInput: importSystemEnumerationFromEnterprise(
      context,
      data.СозданиеПриВводе,
      SE.CreateOnInputFromEnterprise
    ),
    choiceForm: data.ФормаВыбора,
    format: parseI8nText(data.Формат, context),
    editFormat: parseI8nText(data.ФорматРедактирования, context),
  }

  const compactedResult = compactObject(result)
  const defaults = getDefaults(compactedResult, context)
  return removeDefaults(compactedResult, defaults)
}

export const importMetadataAttributesFromEnterprise = (
  context: Context,
  data: MetadataAttributesEnterprise | undefined
): MetadataAttributes | undefined => {
  if (!data) return undefined

  return Object.entries(data)
    .map(([name, value]) => importMetadataAttributeFromEnterprise(context, value, name))
    .filter((item): item is MetadataAttribute => item !== undefined)
}
