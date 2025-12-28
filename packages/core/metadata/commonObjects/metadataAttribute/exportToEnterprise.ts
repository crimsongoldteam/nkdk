import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { exportI8nTextToEnterprise } from "~/metadata/commonObjects/i8nText/exportToEnterprise"
import {
  MetadataAttribute,
  MetadataAttributeEnterprise,
  MetadataAttributes,
  MetadataAttributesEnterprise,
} from "~/metadata/commonObjects/metadataAttribute/types"
import { exportMetadataValueToEnterprise } from "~/metadata/commonObjects/metadataValue/exportToEnterprise"
import { exportTypeDescriptionToEnterprise } from "~/metadata/commonObjects/typeDescription/exportToEnterprise"
import { exportTypeLinkToEnterprise } from "~/metadata/commonObjects/typeLink/exportToEnterprise"
import { exportChoiceParameterLinksToEnterprise } from "~/metadata/commonObjects/сhoiceParameterLinks/exportToEnterprise"
import { Context } from "~/metadata/context/types"
import { compactObject } from "~/metadata/helpers/compactObject"
import { exportSystemEnumerationToEnterprise } from "~/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { isSynonymEqualToName } from "../../helpers/isSynonymEqualToName"
import { exportChoiceParametersToEnterprise } from "../сhoiceParameter/exportToEnterprise"

export const exportMetadataAttributeToEnterprise = (
  context: Context,
  data: MetadataAttribute | undefined
): MetadataAttributeEnterprise | undefined => {
  if (!data) return undefined

  const type = exportTypeDescriptionToEnterprise(context, data.type)!

  let synonym = exportI8nTextToEnterprise(context, data.synonym)

  const excludeSynonym = isSynonymEqualToName(synonym, data.name)

  if (excludeSynonym) {
    synonym = undefined
  }

  if (canUseShortFormat(data, excludeSynonym)) {
    return type
  }

  const result = {
    Тип: type,
    Синоним: synonym,
    БыстрыйВыбор: exportSystemEnumerationToEnterprise(context, data.quickChoice, SE.UseQuickChoiceToEnterprise),
    ВыборГруппИЭлементов: exportSystemEnumerationToEnterprise(
      context,
      data.choiceFoldersAndItems,
      SE.FoldersAndItemsUseToEnterprise
    ),
    ВыделятьОтрицательные: exportBooleanToEnterprise(context, data.markNegatives),
    ЗаполнятьИзДанныхЗаполнения: exportBooleanToEnterprise(context, data.fillFromFillingValue),
    ЗначениеЗаполнения: exportMetadataValueToEnterprise(context, data.fillValue),
    Индексирование: exportSystemEnumerationToEnterprise(context, data.indexing, SE.IndexingToEnterprise),
    Использование: exportSystemEnumerationToEnterprise(context, data.use, SE.AttributeUseToEnterprise),
    ИспользованиеХраненияВХранилищеДвоичныхДанных: exportSystemEnumerationToEnterprise(
      context,
      data.binaryDataStorageLocationUse,
      SE.BinaryDataStorageLocationUseToEnterprise
    ),
    ИсторияВыбораПриВводе: exportSystemEnumerationToEnterprise(
      context,
      data.choiceHistoryOnInput,
      SE.ChoiceHistoryOnInputToEnterprise
    ),
    ИсторияДанных: exportSystemEnumerationToEnterprise(context, data.dataHistory, SE.DataHistoryUseToEnterprise),
    Комментарий: data.comment,
    МаксимальноеЗначение: data.maxValue,
    Маска: data.mask,
    МинимальноеЗначение: data.minValue,
    МногострочныйРежим: exportBooleanToEnterprise(context, data.multiLine),
    ПараметрыВыбора: exportChoiceParametersToEnterprise(context, data.choiceParameters),
    Подсказка: exportI8nTextToEnterprise(context, data.toolTip),
    ПолеИспользованияХраненияВХранилищеДвоичныхДанных: exportBooleanToEnterprise(
      context,
      data.binaryDataStorageLocationUseField
    ),
    ПолнотекстовыйПоиск: exportSystemEnumerationToEnterprise(
      context,
      data.fullTextSearch,
      SE.UseFullTextSearchToEnterprise
    ),
    ПринадлежностьОбъекта: exportSystemEnumerationToEnterprise(
      context,
      data.objectBelonging,
      SE.ObjectBelongingToEnterprise
    ),
    ПроверкаЗаполнения: exportSystemEnumerationToEnterprise(context, data.fillChecking, SE.FillCheckingToEnterprise),
    РасширенноеРедактирование: exportBooleanToEnterprise(context, data.extendedEdit),
    РежимПароля: exportBooleanToEnterprise(context, data.passwordMode),
    СвязиПараметровВыбора: exportChoiceParameterLinksToEnterprise(context, data.choiceParameterLinks),
    СвязьПоТипу: exportTypeLinkToEnterprise(context, data.linkByType),
    СозданиеПриВводе: exportSystemEnumerationToEnterprise(context, data.createOnInput, SE.CreateOnInputToEnterprise),
    ФормаВыбора: data.choiceForm,
    Формат: exportI8nTextToEnterprise(context, data.format),
    ФорматРедактирования: exportI8nTextToEnterprise(context, data.editFormat),
  }

  return compactObject(result) as MetadataAttributeEnterprise
}

export const exportMetadataAttributesToEnterprise = (
  context: Context,
  data: MetadataAttributes | undefined
): MetadataAttributesEnterprise | undefined => {
  if (!data) return undefined

  return Object.fromEntries(
    data.map((value: MetadataAttribute) => [value.name, exportMetadataAttributeToEnterprise(context, value)!])
  )
}

const canUseShortFormat = (data: MetadataAttribute, isSynonymEqualToName: boolean): boolean => {
  for (const key in data) {
    const value = data[key as keyof MetadataAttribute]
    if (value === undefined) continue

    if (["name", "type"].includes(key)) continue

    if (key == "synonym" && isSynonymEqualToName) continue

    return false
  }

  return true
}
