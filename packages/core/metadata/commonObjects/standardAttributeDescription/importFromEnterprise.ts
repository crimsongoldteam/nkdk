import { importBooleanFromEnterprise } from "~/metadata/commonObjects/boolean/importFromEnterprise"
import { importI8nTextFromEnterprise } from "~/metadata/commonObjects/i8nText/importFromEnterprise"
import { importMetadataValueFromEnterprise } from "~/metadata/commonObjects/metadataValue/importFromEnterprise"
import {
  PredefinedNameFromEnterprise,
  StandardAttributeDescription,
  StandardAttributeDescriptionEnterprise,
  StandardAttributeDescriptions,
  StandardAttributeDescriptionsEnterprise,
} from "~/metadata/commonObjects/standardAttributeDescription/types"
import { importTypeDescriptionFromEnterprise } from "~/metadata/commonObjects/typeDescription/importFromEnterprise"
import { importTypeLinkFromEnterprise } from "~/metadata/commonObjects/typeLink/importFromEnterprise"
import { importChoiceParameterLinksFromEnterprise } from "~/metadata/commonObjects/сhoiceParameterLinks/importFromEnterprise"
import { Context } from "~/metadata/context/types"
import { compactObject, removeDefaults } from "~/metadata/helpers/compactObject"
import { importSystemEnumerationFromEnterprise } from "~/metadata/systemEnumerations/importFromEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { getDefaults } from "./defaults"

export const importStandardAttributeDescriptionFromEnterprise = (
  context: Context,
  data: StandardAttributeDescriptionEnterprise | undefined,
  name: string
): StandardAttributeDescription | undefined => {
  if (!data) return undefined

  const result: StandardAttributeDescription = {
    name: PredefinedNameFromEnterprise(name) as any,
    quickChoice: importSystemEnumerationFromEnterprise(context, data.БыстрыйВыбор, SE.UseQuickChoiceFromEnterprise),
    markNegatives: importBooleanFromEnterprise(data.ВыделятьОтрицательные, context),
    fillFromFillingValue: importBooleanFromEnterprise(data.ЗаполнятьИзДанныхЗаполнения, context),
    fillValue: importMetadataValueFromEnterprise(context, data.ЗначениеЗаполнения),
    choiceHistoryOnInput: importSystemEnumerationFromEnterprise(
      context,
      data.ИсторияВыбораПриВводе,
      SE.ChoiceHistoryOnInputFromEnterprise
    ),
    dataHistory: importSystemEnumerationFromEnterprise(context, data.ИсторияДанных, SE.DataHistoryUseFromEnterprise),
    comment: data.Комментарий,
    maxValue: data.МаксимальноеЗначение,
    mask: data.Маска,
    minValue: data.МинимальноеЗначение,
    multiLine: importBooleanFromEnterprise(data.МногострочныйРежим, context),
    choiceParameters: importChoiceParameterLinksFromEnterprise(context, data.ПараметрыВыбора),
    toolTip: importI8nTextFromEnterprise(context, data.Подсказка),
    fullTextSearch: importSystemEnumerationFromEnterprise(
      context,
      data.ПолнотекстовыйПоиск,
      SE.UseFullTextSearchFromEnterprise
    ),
    fillChecking: importSystemEnumerationFromEnterprise(
      context,
      data.ПроверкаЗаполнения,
      SE.FillCheckingFromEnterprise
    ),
    extendedEdit: importBooleanFromEnterprise(data.РасширенноеРедактирование, context),
    passwordMode: importBooleanFromEnterprise(data.РежимПароля, context),
    typeReductionMode: importSystemEnumerationFromEnterprise(
      context,
      data.РежимСокращенияТипа,
      SE.TypeReductionModeFromEnterprise
    ),
    choiceParameterLinks: importChoiceParameterLinksFromEnterprise(context, data.СвязиПараметровВыбора),
    linkByType: importTypeLinkFromEnterprise(context, data.СвязьПоТипу),
    synonym: importI8nTextFromEnterprise(context, data.Синоним),
    createOnInput: importSystemEnumerationFromEnterprise(
      context,
      data.СозданиеПриВводе,
      SE.CreateOnInputFromEnterprise
    ),
    type: importTypeDescriptionFromEnterprise(context, data.Тип),
    choiceForm: data.ФормаВыбора,
    format: importI8nTextFromEnterprise(context, data.Формат),
    editFormat: importI8nTextFromEnterprise(context, data.ФорматРедактирования),
  }

  const compactedResult = compactObject(result)
  const defaults = getDefaults(compactedResult, context)
  return removeDefaults(compactedResult, defaults)
}

export const importStandardAttributeDescriptionsFromEnterprise = (
  context: Context,
  data: StandardAttributeDescriptionsEnterprise | undefined
): StandardAttributeDescriptions | undefined => {
  if (!data) return undefined

  const result: StandardAttributeDescriptions = []

  Object.entries(data).forEach(([name, value]) => {
    const item = importStandardAttributeDescriptionFromEnterprise(context, value, name)
    if (item) {
      result.push(item)
    }
  })

  if (result.length === 0) return undefined

  return result
}
