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
  context: Context,
  data: StandardAttributeDescription | undefined
): StandardAttributeDescriptionEnterprise | undefined => {
  if (!data) return undefined

  return compactObject({
    БыстрыйВыбор: exportSystemEnumerationToEnterprise(context, data.quickChoice, SE.UseQuickChoiceToEnterprise),
    ВыделятьОтрицательные: exportBooleanToEnterprise(context, data.markNegatives),
    ЗаполнятьИзДанныхЗаполнения: exportBooleanToEnterprise(context, data.fillFromFillingValue),
    ЗначениеЗаполнения: exportMetadataValueToEnterprise(context, data.fillValue),
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
    Подсказка: exportI8nTextToEnterprise(context, data.toolTip),
    ПолнотекстовыйПоиск: exportSystemEnumerationToEnterprise(
      context,
      data.fullTextSearch,
      SE.UseFullTextSearchToEnterprise
    ),
    ПроверкаЗаполнения: exportSystemEnumerationToEnterprise(context, data.fillChecking, SE.FillCheckingToEnterprise),
    РасширенноеРедактирование: exportBooleanToEnterprise(context, data.extendedEdit),
    РежимПароля: exportBooleanToEnterprise(context, data.passwordMode),
    РежимСокращенияТипа: exportSystemEnumerationToEnterprise(
      context,
      data.typeReductionMode,
      SE.TypeReductionModeToEnterprise
    ),
    СвязиПараметровВыбора: exportChoiceParameterLinksToEnterprise(context, data.choiceParameterLinks),
    СвязьПоТипу: exportTypeLinkToEnterprise(context, data.linkByType),
    Синоним: exportI8nTextToEnterprise(context, data.synonym),
    СозданиеПриВводе: exportSystemEnumerationToEnterprise(context, data.createOnInput, SE.CreateOnInputToEnterprise),
    Тип: exportTypeDescriptionToEnterprise(context, data.type),
    ФормаВыбора: data.choiceForm,
    Формат: exportI8nTextToEnterprise(context, data.format),
    ФорматРедактирования: exportI8nTextToEnterprise(context, data.editFormat),
  })
}

export const exportStandardAttributeDescriptionsToEnterprise = (
  context: Context,
  data: StandardAttributeDescriptions | undefined
): StandardAttributeDescriptionsEnterprise | undefined => {
  if (!data) return undefined

  const result: StandardAttributeDescriptionsEnterprise = Object.fromEntries(
    data.map((value: StandardAttributeDescription) => [
      PredefinedNameToEnterprise[value.name],
      exportStandardAttributeDescriptionToEnterprise(context, value)!,
    ])
  )

  if (Object.keys(result).length === 0) return undefined

  return result
}
