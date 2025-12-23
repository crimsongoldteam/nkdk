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
import { Context } from "~/lib/metadata/context/types"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { isSynonymEqualToName } from "../../helpers/isSynonymEqualToName"

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
    ЗначениеЗаполнения: exportMetadataValueToEnterprise(context, data.fillingValue),
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
    ПараметрыВыбора: exportChoiceParameterLinksToEnterprise(context, data.choiceParameters),
    Подсказка: exportI8nTextToEnterprise(context, data.tooltip),
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
