import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { exportI8nTextToEnterprise } from "~/lib/metadata/commonObjects/i8nText/exportToEnterprise"
import {
  MetadataAttribute,
  MetadataAttributeEnterprise,
  MetadataAttributes,
  MetadataAttributesEnterprise,
} from "~/lib/metadata/commonObjects/metadataAttribute/types"
import { exportMetadataValueToEnterprise } from "~/lib/metadata/commonObjects/metadataValue/exportToEnterprise"
import { exportTypeDescriptionToEnterprise } from "~/lib/metadata/commonObjects/typeDescription/exportToEnterprise"
import { exportTypeLinkToEnterprise } from "~/lib/metadata/commonObjects/typeLink/exportToEnterprise"
import { exportChoiceParameterLinksToEnterprise } from "~/lib/metadata/commonObjects/сhoiceParameterLinks/exportToEnterprise"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export const exportMetadataAttributeToEnterprise = (
  data: MetadataAttribute | undefined
): MetadataAttributeEnterprise | undefined => {
  if (!data) return undefined

  return {
    ИспользованиеХраненияВХранилищеДвоичныхДанных: exportSystemEnumerationToEnterprise(
      data.binaryDataStorageLocationUse,
      SE.BinaryDataStorageLocationUseToEnterprise
    ),
    ПолеИспользованияХраненияВХранилищеДвоичныхДанных: exportBooleanToEnterprise(
      data.binaryDataStorageLocationUseField
    ),
    ВыборГруппИЭлементов: exportSystemEnumerationToEnterprise(
      data.choiceFoldersAndItems,
      SE.FoldersAndItemsUseToEnterprise
    ),
    ФормаВыбора: data.choiceForm,
    ИсторияВыбораПриВводе: exportSystemEnumerationToEnterprise(
      data.choiceHistoryOnInput,
      SE.ChoiceHistoryOnInputToEnterprise
    ),
    СвязиПараметровВыбора: exportChoiceParameterLinksToEnterprise(data.choiceParameterLinks),
    ПараметрыВыбора: exportChoiceParameterLinksToEnterprise(data.choiceParameters),
    Комментарий: data.comment,
    СозданиеПриВводе: exportSystemEnumerationToEnterprise(data.createOnInput, SE.CreateOnInputToEnterprise),
    ИсторияДанных: exportSystemEnumerationToEnterprise(data.dataHistory, SE.DataHistoryUseToEnterprise),
    ФорматРедактирования: exportI8nTextToEnterprise(data.editFormat),
    РасширенноеРедактирование: exportBooleanToEnterprise(data.extendedEdit),
    ПроверкаЗаполнения: exportSystemEnumerationToEnterprise(data.fillChecking, SE.FillCheckingToEnterprise),
    ЗаполнятьИзДанныхЗаполнения: exportBooleanToEnterprise(data.fillFromFillingValue),
    ЗначениеЗаполнения: exportMetadataValueToEnterprise(data.fillingValue),
    Формат: exportI8nTextToEnterprise(data.format),
    ПолнотекстовыйПоиск: exportSystemEnumerationToEnterprise(data.fullTextSearch, SE.UseFullTextSearchToEnterprise),
    Индексирование: exportSystemEnumerationToEnterprise(data.indexing, SE.IndexingToEnterprise),
    СвязьПоТипу: exportTypeLinkToEnterprise(data.linkByType),
    ВыделятьОтрицательные: exportBooleanToEnterprise(data.markNegatives),
    Маска: data.mask,
    МаксимальноеЗначение: data.maxValue,
    МинимальноеЗначение: data.minValue,
    МногострочныйРежим: exportBooleanToEnterprise(data.multiLine),
    Имя: data.name,
    ПринадлежностьОбъекта: exportSystemEnumerationToEnterprise(data.objectBelonging, SE.ObjectBelongingToEnterprise),
    РежимПароля: exportBooleanToEnterprise(data.passwordMode),
    БыстрыйВыбор: exportSystemEnumerationToEnterprise(data.quickChoice, SE.UseQuickChoiceToEnterprise),
    Синоним: exportI8nTextToEnterprise(data.synonym),
    Подсказка: exportI8nTextToEnterprise(data.tooltip),
    Тип: exportTypeDescriptionToEnterprise(data.type),
    Использование: exportSystemEnumerationToEnterprise(data.use, SE.AttributeUseToEnterprise),
  }
}

export const exportMetadataAttributesToEnterprise = (
  data: MetadataAttributes | undefined
): MetadataAttributesEnterprise | undefined => {
  if (!data) return undefined

  return data.map((value: MetadataAttribute) => exportMetadataAttributeToEnterprise(value)!)
}
