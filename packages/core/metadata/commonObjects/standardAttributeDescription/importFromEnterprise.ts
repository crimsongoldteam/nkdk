import { importBooleanFromEnterprise } from "~/metadata/commonObjects/boolean/importFromEnterprise"
import { importI8nTextFromEnterprise } from "~/metadata/commonObjects/i8nText/importFromEnterprise"
import { importMetadataValueFromEnterprise } from "~/metadata/commonObjects/metadataValue/importFromEnterprise"
import {
  StandardAttributeDescription,
  StandardAttributeDescriptionEnterprise,
  StandardAttributeDescriptions,
  StandardAttributeDescriptionsEnterprise,
  StandartAttributeNameFromEnterprise,
} from "~/metadata/commonObjects/standardAttributeDescription/types"
import { importTypeDescriptionFromEnterprise } from "~/metadata/commonObjects/typeDescription/importFromEnterprise"
import { importTypeLinkFromEnterprise } from "~/metadata/commonObjects/typeLink/importFromEnterprise"
import { importChoiceParameterLinksFromEnterprise } from "~/metadata/commonObjects/сhoiceParameterLinks/importFromEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { removeDefaults } from "~/metadata/helpers/compactObject"
import { importSystemEnumerationFromYAML } from "~/metadata/systemEnumerations/importFromEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { importChoiceParametersFromEnterprise } from "../сhoiceParameters/importFromEnterprise"
import { getDefaults } from "./defaults"

export const importStandardAttributeDescriptionsFromEnterprise = (
  context: ConfigurationContext,
  data: StandardAttributeDescriptionsEnterprise | undefined
): StandardAttributeDescriptions | undefined => {
  if (!data) return undefined

  const result: StandardAttributeDescriptions = []

  Object.entries(data).forEach(([name, value]) => {
    result.push(importStandardAttributeDescriptionFromEnterprise(context, value, name)!)
  })

  if (result.length === 0) return undefined

  return result
}

const importStandardAttributeDescriptionFromEnterprise = (
  context: ConfigurationContext,
  data: StandardAttributeDescriptionEnterprise,
  name: string
): StandardAttributeDescription => {
  const result: StandardAttributeDescription = {
    name: StandartAttributeNameFromEnterprise(name),
  }

  const quickChoice = importSystemEnumerationFromYAML<SE.UseQuickChoice>(
    context,
    data.БыстрыйВыбор,
    SE.UseQuickChoiceFromEnterprise
  )
  if (quickChoice) result.quickChoice = quickChoice

  const markNegatives = importBooleanFromEnterprise(context, data.ВыделятьОтрицательные)
  if (markNegatives !== undefined) result.markNegatives = markNegatives

  const fillFromFillingValue = importBooleanFromEnterprise(context, data.ЗаполнятьИзДанныхЗаполнения)
  if (fillFromFillingValue !== undefined) result.fillFromFillingValue = fillFromFillingValue

  const fillValue = importMetadataValueFromEnterprise(context, data.ЗначениеЗаполнения)
  if (fillValue) result.fillValue = fillValue

  const choiceHistoryOnInput = importSystemEnumerationFromYAML<SE.ChoiceHistoryOnInput>(
    context,
    data.ИсторияВыбораПриВводе,
    SE.ChoiceHistoryOnInputFromEnterprise
  )
  if (choiceHistoryOnInput) result.choiceHistoryOnInput = choiceHistoryOnInput

  const dataHistory = importSystemEnumerationFromYAML<SE.DataHistoryUse>(
    context,
    data.ИсторияДанных,
    SE.DataHistoryUseFromEnterprise
  )
  if (dataHistory) result.dataHistory = dataHistory

  if (data.Комментарий) result.comment = data.Комментарий
  if (data.МаксимальноеЗначение !== undefined) result.maxValue = data.МаксимальноеЗначение
  if (data.Маска) result.mask = data.Маска
  if (data.МинимальноеЗначение !== undefined) result.minValue = data.МинимальноеЗначение

  const multiLine = importBooleanFromEnterprise(context, data.МногострочныйРежим)
  if (multiLine !== undefined) result.multiLine = multiLine

  const choiceParameters = importChoiceParametersFromEnterprise(context, data.ПараметрыВыбора)
  if (choiceParameters) result.choiceParameters = choiceParameters

  const toolTip = importI8nTextFromEnterprise(context, data.Подсказка)
  if (toolTip) result.toolTip = toolTip

  const fullTextSearch = importSystemEnumerationFromYAML<SE.UseFullTextSearch>(
    context,
    data.ПолнотекстовыйПоиск,
    SE.UseFullTextSearchFromEnterprise
  )
  if (fullTextSearch) result.fullTextSearch = fullTextSearch

  const fillChecking = importSystemEnumerationFromYAML<SE.FillChecking>(
    context,
    data.ПроверкаЗаполнения,
    SE.FillCheckingFromEnterprise
  )
  if (fillChecking) result.fillChecking = fillChecking

  const extendedEdit = importBooleanFromEnterprise(context, data.РасширенноеРедактирование)
  if (extendedEdit !== undefined) result.extendedEdit = extendedEdit

  const passwordMode = importBooleanFromEnterprise(context, data.РежимПароля)
  if (passwordMode !== undefined) result.passwordMode = passwordMode

  const typeReductionMode = importSystemEnumerationFromYAML<SE.TypeReductionMode>(
    context,
    data.РежимСокращенияТипа,
    SE.TypeReductionModeFromEnterprise
  )
  if (typeReductionMode) result.typeReductionMode = typeReductionMode

  const choiceParameterLinks = importChoiceParameterLinksFromEnterprise(context, data.СвязиПараметровВыбора)
  if (choiceParameterLinks) result.choiceParameterLinks = choiceParameterLinks

  const linkByType = importTypeLinkFromEnterprise(context, data.СвязьПоТипу)
  if (linkByType) result.linkByType = linkByType

  const synonym = importI8nTextFromEnterprise(context, data.Синоним)
  if (synonym) result.synonym = synonym

  const createOnInput = importSystemEnumerationFromYAML<SE.CreateOnInput>(
    context,
    data.СозданиеПриВводе,
    SE.CreateOnInputFromEnterprise
  )
  if (createOnInput) result.createOnInput = createOnInput

  const type = importTypeDescriptionFromEnterprise(context, data.Тип)
  if (type) result.type = type

  if (data.ФормаВыбора) result.choiceForm = data.ФормаВыбора

  const format = importI8nTextFromEnterprise(context, data.Формат)
  if (format) result.format = format

  const editFormat = importI8nTextFromEnterprise(context, data.ФорматРедактирования)
  if (editFormat) result.editFormat = editFormat

  const defaults = getDefaults(context, result)
  return removeDefaults(result, defaults)
}
