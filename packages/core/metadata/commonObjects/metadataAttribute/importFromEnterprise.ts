import { importBooleanFromEnterprise } from "~/metadata/commonObjects/boolean/importFromEnterprise"
import {
  MetadataAttribute,
  MetadataAttributeEnterprise,
  MetadataAttributes,
  MetadataAttributesEnterprise,
} from "~/metadata/commonObjects/metadataAttribute/types"
import { importTypeDescriptionFromEnterprise } from "~/metadata/commonObjects/typeDescription/importFromEnterprise"
import { importChoiceParametersFromEnterprise } from "~/metadata/commonObjects/сhoiceParameter/importFromEnterprise"
import { importChoiceParameterLinksFromEnterprise } from "~/metadata/commonObjects/сhoiceParameterLinks/importFromEnterprise"
import { Context } from "~/metadata/context/types"
import { compactObject, removeDefaults } from "~/metadata/helpers/compactObject"
import { importSystemEnumerationFromEnterprise } from "~/metadata/systemEnumerations/importFromEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { isSynonymEqualToName } from "../../helpers/isSynonymEqualToName"
import { importI8nTextFromEnterprise } from "../i8nText/importFromEnterprise.ts"
import { importMetadataValueFromEnterprise } from "../metadataValue/importFromEnterprise.ts"
import { importTypeLinkFromEnterprise } from "../typeLink/importFromEnterprise.ts"
import { getDefaults } from "./defaults"

export const importMetadataAttributeFromEnterprise = (
  context: Context,
  data: MetadataAttributeEnterprise | undefined,
  name: string
): MetadataAttribute | undefined => {
  if (!data) return undefined

  // Если data - строка, это короткий формат (только тип)
  if (typeof data === "string") {
    const type = importTypeDescriptionFromEnterprise(context, data)
    if (!type) return undefined

    return {
      name,
      type,
    }
  }

  // Полный формат - объект
  const type = importTypeDescriptionFromEnterprise(context, data.Тип)
  if (!type) return undefined

  const synonym = importI8nTextFromEnterprise(context, data.Синоним)
  const excludeSynonym = isSynonymEqualToName(typeof data.Синоним === "string" ? data.Синоним : undefined, name)

  const result: MetadataAttribute = {
    name,
    type,
    synonym: excludeSynonym ? undefined : synonym,
    quickChoice: importSystemEnumerationFromEnterprise(context, data.БыстрыйВыбор, SE.UseQuickChoiceFromEnterprise),
    choiceFoldersAndItems: importSystemEnumerationFromEnterprise(
      context,
      data.ВыборГруппИЭлементов,
      SE.FoldersAndItemsUseFromEnterprise
    ),
    markNegatives: importBooleanFromEnterprise(context, data.ВыделятьОтрицательные),
    fillFromFillingValue: importBooleanFromEnterprise(context, data.ЗаполнятьИзДанныхЗаполнения),
    fillValue: importMetadataValueFromEnterprise(context, data.ЗначениеЗаполнения),
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
    multiLine: importBooleanFromEnterprise(context, data.МногострочныйРежим),
    choiceParameters: importChoiceParametersFromEnterprise(context, data.ПараметрыВыбора),
    toolTip: importI8nTextFromEnterprise(context, data.Подсказка),
    binaryDataStorageLocationUseField: importBooleanFromEnterprise(
      context,
      data.ПолеИспользованияХраненияВХранилищеДвоичныхДанных
    ),
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
    extendedEdit: importBooleanFromEnterprise(context, data.РасширенноеРедактирование),
    passwordMode: importBooleanFromEnterprise(context, data.РежимПароля),
    choiceParameterLinks: importChoiceParameterLinksFromEnterprise(context, data.СвязиПараметровВыбора),
    linkByType: importTypeLinkFromEnterprise(context, data.СвязьПоТипу),
    createOnInput: importSystemEnumerationFromEnterprise(
      context,
      data.СозданиеПриВводе,
      SE.CreateOnInputFromEnterprise
    ),
    choiceForm: data.ФормаВыбора,
    format: importI8nTextFromEnterprise(context, data.Формат),
    editFormat: importI8nTextFromEnterprise(context, data.ФорматРедактирования),
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
