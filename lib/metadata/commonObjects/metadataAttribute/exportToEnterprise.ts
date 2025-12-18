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
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export const exportMetadataAttributeToEnterprise = (
  data: MetadataAttribute | undefined,
  configurationSettings: ConfigurationSettings
): MetadataAttributeEnterprise | undefined => {
  if (!data) return undefined

  return compactObject({
    ИспользованиеХраненияВХранилищеДвоичныхДанных: exportSystemEnumerationToEnterprise(
      data.binaryDataStorageLocationUse,
      SE.BinaryDataStorageLocationUseToEnterprise,
      configurationSettings
    ),
    ПолеИспользованияХраненияВХранилищеДвоичныхДанных: exportBooleanToEnterprise(
      data.binaryDataStorageLocationUseField,
      configurationSettings
    ),
    ВыборГруппИЭлементов: exportSystemEnumerationToEnterprise(
      data.choiceFoldersAndItems,
      SE.FoldersAndItemsUseToEnterprise,
      configurationSettings
    ),
    ФормаВыбора: data.choiceForm,
    ИсторияВыбораПриВводе: exportSystemEnumerationToEnterprise(
      data.choiceHistoryOnInput,
      SE.ChoiceHistoryOnInputToEnterprise,
      configurationSettings
    ),
    СвязиПараметровВыбора: exportChoiceParameterLinksToEnterprise(data.choiceParameterLinks, configurationSettings),
    ПараметрыВыбора: exportChoiceParameterLinksToEnterprise(data.choiceParameters, configurationSettings),
    Комментарий: data.comment,
    СозданиеПриВводе: exportSystemEnumerationToEnterprise(
      data.createOnInput,
      SE.CreateOnInputToEnterprise,
      configurationSettings
    ),
    ИсторияДанных: exportSystemEnumerationToEnterprise(
      data.dataHistory,
      SE.DataHistoryUseToEnterprise,
      configurationSettings
    ),
    ФорматРедактирования: exportI8nTextToEnterprise(data.editFormat, configurationSettings),
    РасширенноеРедактирование: exportBooleanToEnterprise(data.extendedEdit, configurationSettings),
    ПроверкаЗаполнения: exportSystemEnumerationToEnterprise(
      data.fillChecking,
      SE.FillCheckingToEnterprise,
      configurationSettings
    ),
    ЗаполнятьИзДанныхЗаполнения: exportBooleanToEnterprise(data.fillFromFillingValue, configurationSettings),
    ЗначениеЗаполнения: exportMetadataValueToEnterprise(data.fillingValue, configurationSettings),
    Формат: exportI8nTextToEnterprise(data.format, configurationSettings),
    ПолнотекстовыйПоиск: exportSystemEnumerationToEnterprise(
      data.fullTextSearch,
      SE.UseFullTextSearchToEnterprise,
      configurationSettings
    ),
    Индексирование: exportSystemEnumerationToEnterprise(data.indexing, SE.IndexingToEnterprise, configurationSettings),
    СвязьПоТипу: exportTypeLinkToEnterprise(data.linkByType, configurationSettings),
    ВыделятьОтрицательные: exportBooleanToEnterprise(data.markNegatives, configurationSettings),
    Маска: data.mask,
    МаксимальноеЗначение: data.maxValue,
    МинимальноеЗначение: data.minValue,
    МногострочныйРежим: exportBooleanToEnterprise(data.multiLine, configurationSettings),
    ПринадлежностьОбъекта: exportSystemEnumerationToEnterprise(
      data.objectBelonging,
      SE.ObjectBelongingToEnterprise,
      configurationSettings
    ),
    РежимПароля: exportBooleanToEnterprise(data.passwordMode, configurationSettings),
    БыстрыйВыбор: exportSystemEnumerationToEnterprise(
      data.quickChoice,
      SE.UseQuickChoiceToEnterprise,
      configurationSettings
    ),
    Синоним: exportI8nTextToEnterprise(data.synonym, configurationSettings),
    Подсказка: exportI8nTextToEnterprise(data.tooltip, configurationSettings),
    Тип: exportTypeDescriptionToEnterprise(data.type, configurationSettings),
    Использование: exportSystemEnumerationToEnterprise(data.use, SE.AttributeUseToEnterprise, configurationSettings),
  })
}

export const exportMetadataAttributesToEnterprise = (
  data: MetadataAttributes | undefined,
  configurationSettings: ConfigurationSettings
): MetadataAttributesEnterprise | undefined => {
  if (!data) return undefined

  return Object.fromEntries(
    data.map((value: MetadataAttribute) => [
      value.name,
      exportMetadataAttributeToEnterprise(value, configurationSettings)!,
    ])
  )
}
