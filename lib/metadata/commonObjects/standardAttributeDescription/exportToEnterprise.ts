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
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export const exportStandardAttributeDescriptionToEnterprise = (
  data: StandardAttributeDescription | undefined,
  configurationSettings: ConfigurationSettings
): StandardAttributeDescriptionEnterprise | undefined => {
  if (!data) return undefined

  return compactObject({
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
    ЗначениеЗаполнения: exportMetadataValueToEnterprise(data.fillValue, configurationSettings),
    Формат: exportI8nTextToEnterprise(data.format, configurationSettings),
    ПолнотекстовыйПоиск: exportSystemEnumerationToEnterprise(
      data.fullTextSearch,
      SE.UseFullTextSearchToEnterprise,
      configurationSettings
    ),
    СвязьПоТипу: exportTypeLinkToEnterprise(data.linkByType, configurationSettings),
    ВыделятьОтрицательные: exportBooleanToEnterprise(data.markNegatives, configurationSettings),
    Маска: data.mask,
    МаксимальноеЗначение: data.maxValue,
    МинимальноеЗначение: data.minValue,
    МногострочныйРежим: exportBooleanToEnterprise(data.multiLine, configurationSettings),
    Имя: data.name,
    РежимПароля: exportBooleanToEnterprise(data.passwordMode, configurationSettings),
    БыстрыйВыбор: exportBooleanToEnterprise(data.quickChoice, configurationSettings),
    Синоним: exportI8nTextToEnterprise(data.synonym, configurationSettings),
    Подсказка: exportI8nTextToEnterprise(data.toolTip, configurationSettings),
    Тип: exportTypeDescriptionToEnterprise(data.type, configurationSettings),
    РежимСокращенияТипа: exportSystemEnumerationToEnterprise(
      data.typeReductionMode,
      SE.TypeReductionModeToEnterprise,
      configurationSettings
    ),
  })
}

export const exportStandardAttributeDescriptionsToEnterprise = (
  data: StandardAttributeDescriptions | undefined,
  configurationSettings: ConfigurationSettings
): StandardAttributeDescriptionsEnterprise | undefined => {
  if (!data) return undefined

  return data.map(
    (value: StandardAttributeDescription) =>
      exportStandardAttributeDescriptionToEnterprise(value, configurationSettings)!
  )
}
