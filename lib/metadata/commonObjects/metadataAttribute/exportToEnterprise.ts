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
import { isSynonymEqualToName } from "../../helpers/isSynonymEqualToName"

export const exportMetadataAttributeToEnterprise = (
  configurationSettings: ConfigurationSettings,
  data: MetadataAttribute | undefined
): MetadataAttributeEnterprise | undefined => {
  if (!data) return undefined

  const type = exportTypeDescriptionToEnterprise(configurationSettings, data.type)!

  let synonym = exportI8nTextToEnterprise(configurationSettings, data.synonym)

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
    БыстрыйВыбор: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.quickChoice,
      SE.UseQuickChoiceToEnterprise
    ),
    ВыборГруппИЭлементов: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.choiceFoldersAndItems,
      SE.FoldersAndItemsUseToEnterprise
    ),
    ВыделятьОтрицательные: exportBooleanToEnterprise(configurationSettings, data.markNegatives),
    ЗаполнятьИзДанныхЗаполнения: exportBooleanToEnterprise(configurationSettings, data.fillFromFillingValue),
    ЗначениеЗаполнения: exportMetadataValueToEnterprise(configurationSettings, data.fillingValue),
    Индексирование: exportSystemEnumerationToEnterprise(configurationSettings, data.indexing, SE.IndexingToEnterprise),
    Использование: exportSystemEnumerationToEnterprise(configurationSettings, data.use, SE.AttributeUseToEnterprise),
    ИспользованиеХраненияВХранилищеДвоичныхДанных: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.binaryDataStorageLocationUse,
      SE.BinaryDataStorageLocationUseToEnterprise
    ),
    ИсторияВыбораПриВводе: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.choiceHistoryOnInput,
      SE.ChoiceHistoryOnInputToEnterprise
    ),
    ИсторияДанных: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.dataHistory,
      SE.DataHistoryUseToEnterprise
    ),
    Комментарий: data.comment,
    МаксимальноеЗначение: data.maxValue,
    Маска: data.mask,
    МинимальноеЗначение: data.minValue,
    МногострочныйРежим: exportBooleanToEnterprise(configurationSettings, data.multiLine),
    ПараметрыВыбора: exportChoiceParameterLinksToEnterprise(configurationSettings, data.choiceParameters),
    Подсказка: exportI8nTextToEnterprise(configurationSettings, data.tooltip),
    ПолеИспользованияХраненияВХранилищеДвоичныхДанных: exportBooleanToEnterprise(
      configurationSettings,
      data.binaryDataStorageLocationUseField
    ),
    ПолнотекстовыйПоиск: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.fullTextSearch,
      SE.UseFullTextSearchToEnterprise
    ),
    ПринадлежностьОбъекта: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.objectBelonging,
      SE.ObjectBelongingToEnterprise
    ),
    ПроверкаЗаполнения: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.fillChecking,
      SE.FillCheckingToEnterprise
    ),
    РасширенноеРедактирование: exportBooleanToEnterprise(configurationSettings, data.extendedEdit),
    РежимПароля: exportBooleanToEnterprise(configurationSettings, data.passwordMode),
    СвязиПараметровВыбора: exportChoiceParameterLinksToEnterprise(configurationSettings, data.choiceParameterLinks),
    СвязьПоТипу: exportTypeLinkToEnterprise(configurationSettings, data.linkByType),
    СозданиеПриВводе: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.createOnInput,
      SE.CreateOnInputToEnterprise
    ),
    ФормаВыбора: data.choiceForm,
    Формат: exportI8nTextToEnterprise(configurationSettings, data.format),
    ФорматРедактирования: exportI8nTextToEnterprise(configurationSettings, data.editFormat),
  }

  return compactObject(result) as MetadataAttributeEnterprise
}

export const exportMetadataAttributesToEnterprise = (
  configurationSettings: ConfigurationSettings,
  data: MetadataAttributes | undefined
): MetadataAttributesEnterprise | undefined => {
  if (!data) return undefined

  return Object.fromEntries(
    data.map((value: MetadataAttribute) => [
      value.name,
      exportMetadataAttributeToEnterprise(configurationSettings, value)!,
    ])
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
