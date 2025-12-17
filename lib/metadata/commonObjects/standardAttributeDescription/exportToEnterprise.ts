import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { exportI8nTextToEnterprise } from "~/lib/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportMetadataValueToEnterprise } from "~/lib/metadata/commonObjects/metadataValue/exportToEnterprise"
import {
  StandardAttributeDescription,
  StandardAttributeDescriptionEnterprise,
  StandardAttributeDescriptions,
  StandardAttributeDescriptionsEnterprise,
} from "~/lib/metadata/commonObjects/standardAttributeDescription/types"
import { exportTypeDescriptionToEnterprise } from "~/lib/metadata/commonObjects/typeDescription/exportToEnterprise"
import { exportTypeLinkToEnterprise } from "~/lib/metadata/commonObjects/typeLink/exportToEnterprise"
import { exportChoiceParameterLinksToEnterprise } from "~/lib/metadata/commonObjects/сhoiceParameterLinks/exportToEnterprise"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export const exportStandardAttributeDescriptionToEnterprise = (
  data: StandardAttributeDescription | undefined
): StandardAttributeDescriptionEnterprise | undefined => {
  if (!data) return undefined

  return {
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
    ЗначениеЗаполнения: exportMetadataValueToEnterprise(data.fillValue),
    Формат: exportI8nTextToEnterprise(data.format),
    ПолнотекстовыйПоиск: exportSystemEnumerationToEnterprise(data.fullTextSearch, SE.UseFullTextSearchToEnterprise),
    СвязьПоТипу: exportTypeLinkToEnterprise(data.linkByType),
    ВыделятьОтрицательные: exportBooleanToEnterprise(data.markNegatives),
    Маска: data.mask,
    МаксимальноеЗначение: data.maxValue,
    МинимальноеЗначение: data.minValue,
    МногострочныйРежим: exportBooleanToEnterprise(data.multiLine),
    Имя: data.name,
    РежимПароля: exportBooleanToEnterprise(data.passwordMode),
    БыстрыйВыбор: exportBooleanToEnterprise(data.quickChoice),
    Синоним: exportI8nTextToEnterprise(data.synonym),
    Подсказка: exportI8nTextToEnterprise(data.toolTip),
    Тип: exportTypeDescriptionToEnterprise(data.type),
    РежимСокращенияТипа: exportSystemEnumerationToEnterprise(data.typeReductionMode, SE.TypeReductionModeToEnterprise),
  }
}

export const exportStandardAttributeDescriptionsToEnterprise = (
  data: StandardAttributeDescriptions | undefined
): StandardAttributeDescriptionsEnterprise | undefined => {
  if (!data) return undefined

  return data.map((value: StandardAttributeDescription) => exportStandardAttributeDescriptionToEnterprise(value)!)
}
