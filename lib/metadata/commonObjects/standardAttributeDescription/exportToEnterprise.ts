import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { exportI8nTextToEnterprise } from "~/lib/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportMetadataValueToEnterprise } from "~/lib/metadata/commonObjects/metadataValue/exportToEnterprise"
import {
  PredefinedNameToEnterprise,
  StandardAttributeDescription,
  StandardAttributeDescriptionEnterprise,
  StandardAttributeDescriptions,
  StandardAttributeDescriptionsEnterprise,
} from "~/lib/metadata/commonObjects/standardAttributeDescription/types"
import { exportTypeDescriptionToEnterprise } from "~/lib/metadata/commonObjects/typeDescription/exportToEnterprise"
import { exportTypeLinkToEnterprise } from "~/lib/metadata/commonObjects/typeLink/exportToEnterprise"
import { exportChoiceParameterLinksToEnterprise } from "~/lib/metadata/commonObjects/сhoiceParameterLinks/exportToEnterprise"
import { Context } from "~/lib/metadata/context/types"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export const exportStandardAttributeDescriptionToEnterprise = (
  configurationSettings: Context,
  data: StandardAttributeDescription | undefined
): StandardAttributeDescriptionEnterprise | undefined => {
  if (!data) return undefined

  return compactObject({
    БыстрыйВыбор: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.quickChoice,
      SE.UseQuickChoiceToEnterprise
    ),
    ВыделятьОтрицательные: exportBooleanToEnterprise(configurationSettings, data.markNegatives),
    ЗаполнятьИзДанныхЗаполнения: exportBooleanToEnterprise(configurationSettings, data.fillFromFillingValue),
    ЗначениеЗаполнения: exportMetadataValueToEnterprise(configurationSettings, data.fillValue),
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
    Подсказка: exportI8nTextToEnterprise(configurationSettings, data.toolTip),
    ПолнотекстовыйПоиск: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.fullTextSearch,
      SE.UseFullTextSearchToEnterprise
    ),
    ПроверкаЗаполнения: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.fillChecking,
      SE.FillCheckingToEnterprise
    ),
    РасширенноеРедактирование: exportBooleanToEnterprise(configurationSettings, data.extendedEdit),
    РежимПароля: exportBooleanToEnterprise(configurationSettings, data.passwordMode),
    РежимСокращенияТипа: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.typeReductionMode,
      SE.TypeReductionModeToEnterprise
    ),
    СвязиПараметровВыбора: exportChoiceParameterLinksToEnterprise(configurationSettings, data.choiceParameterLinks),
    СвязьПоТипу: exportTypeLinkToEnterprise(configurationSettings, data.linkByType),
    Синоним: exportI8nTextToEnterprise(configurationSettings, data.synonym),
    СозданиеПриВводе: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.createOnInput,
      SE.CreateOnInputToEnterprise
    ),
    Тип: exportTypeDescriptionToEnterprise(configurationSettings, data.type),
    ФормаВыбора: data.choiceForm,
    Формат: exportI8nTextToEnterprise(configurationSettings, data.format),
    ФорматРедактирования: exportI8nTextToEnterprise(configurationSettings, data.editFormat),
  })
}

export const exportStandardAttributeDescriptionsToEnterprise = (
  configurationSettings: Context,
  data: StandardAttributeDescriptions | undefined
): StandardAttributeDescriptionsEnterprise | undefined => {
  if (!data) return undefined

  const result: StandardAttributeDescriptionsEnterprise = Object.fromEntries(
    data.map((value: StandardAttributeDescription) => [
      PredefinedNameToEnterprise[value.name],
      exportStandardAttributeDescriptionToEnterprise(configurationSettings, value)!,
    ])
  )

  if (Object.keys(result).length === 0) return undefined

  return result
}
