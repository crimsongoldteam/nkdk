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
    БыстрыйВыбор: exportSystemEnumerationToEnterprise(
      data.quickChoice,
      SE.UseQuickChoiceToEnterprise,
      configurationSettings
    ),
    ВыделятьОтрицательные: exportBooleanToEnterprise(data.markNegatives, configurationSettings),
    ЗаполнятьИзДанныхЗаполнения: exportBooleanToEnterprise(data.fillFromFillingValue, configurationSettings),
    ЗначениеЗаполнения: exportMetadataValueToEnterprise(data.fillValue, configurationSettings),
    ИсторияВыбораПриВводе: exportSystemEnumerationToEnterprise(
      data.choiceHistoryOnInput,
      SE.ChoiceHistoryOnInputToEnterprise,
      configurationSettings
    ),
    ИсторияДанных: exportSystemEnumerationToEnterprise(
      data.dataHistory,
      SE.DataHistoryUseToEnterprise,
      configurationSettings
    ),
    Комментарий: data.comment,
    МаксимальноеЗначение: data.maxValue,
    Маска: data.mask,
    МинимальноеЗначение: data.minValue,
    МногострочныйРежим: exportBooleanToEnterprise(data.multiLine, configurationSettings),
    ПараметрыВыбора: exportChoiceParameterLinksToEnterprise(data.choiceParameters, configurationSettings),
    Подсказка: exportI8nTextToEnterprise(data.toolTip, configurationSettings),
    ПолнотекстовыйПоиск: exportSystemEnumerationToEnterprise(
      data.fullTextSearch,
      SE.UseFullTextSearchToEnterprise,
      configurationSettings
    ),
    ПроверкаЗаполнения: exportSystemEnumerationToEnterprise(
      data.fillChecking,
      SE.FillCheckingToEnterprise,
      configurationSettings
    ),
    РасширенноеРедактирование: exportBooleanToEnterprise(data.extendedEdit, configurationSettings),
    РежимПароля: exportBooleanToEnterprise(data.passwordMode, configurationSettings),
    РежимСокращенияТипа: exportSystemEnumerationToEnterprise(
      data.typeReductionMode,
      SE.TypeReductionModeToEnterprise,
      configurationSettings
    ),
    СвязиПараметровВыбора: exportChoiceParameterLinksToEnterprise(data.choiceParameterLinks, configurationSettings),
    СвязьПоТипу: exportTypeLinkToEnterprise(data.linkByType, configurationSettings),
    Синоним: exportI8nTextToEnterprise(data.synonym, configurationSettings),
    СозданиеПриВводе: exportSystemEnumerationToEnterprise(
      data.createOnInput,
      SE.CreateOnInputToEnterprise,
      configurationSettings
    ),
    Тип: exportTypeDescriptionToEnterprise(data.type, configurationSettings),
    ФормаВыбора: data.choiceForm,
    Формат: exportI8nTextToEnterprise(data.format, configurationSettings),
    ФорматРедактирования: exportI8nTextToEnterprise(data.editFormat, configurationSettings),
  })
}

export const exportStandardAttributeDescriptionsToEnterprise = (
  data: StandardAttributeDescriptions | undefined,
  configurationSettings: ConfigurationSettings
): StandardAttributeDescriptionsEnterprise | undefined => {
  if (!data) return undefined

  return Object.fromEntries(
    data.map((value: StandardAttributeDescription) => [
      value.name,
      exportStandardAttributeDescriptionToEnterprise(value, configurationSettings)!,
    ])
  )
}
