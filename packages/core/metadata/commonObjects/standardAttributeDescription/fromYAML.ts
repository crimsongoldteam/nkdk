import { importBooleanFromYAML } from "~/metadata/commonObjects/boolean/fromYAML"
import { importI8nTextFromYAML } from "~/metadata/commonObjects/i8nText/fromYAML"
import { importMetadataValueFromYAML } from "~/metadata/commonObjects/metadataValue/fromYAML"
import {
  StandardAttributeDescription,
  StandardAttributeDescriptionYAML,
  StandardAttributeDescriptions,
  StandardAttributeDescriptionsYAML,
  StandartAttributeNameFromYAML,
} from "~/metadata/commonObjects/standardAttributeDescription/types"
import { importTypeDescriptionFromYAML } from "~/metadata/commonObjects/typeDescription/fromYAML"
import { importTypeLinkFromYAML } from "~/metadata/commonObjects/typeLink/fromYAML"
import { importChoiceParameterLinksFromYAML } from "~/metadata/commonObjects/сhoiceParameterLinks/fromYAML"
import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { removeDefaults } from "~/metadata/helpers/compactObject"
import { registerTypeRule } from "~/metadata/metadataFactory"
import { importSystemEnumerationFromYAMLDeprecated } from "~/metadata/systemEnumerations/fromYAML"
import * as SE from "~/metadata/systemEnumerations/types"
import { importChoiceParametersFromYAML } from "../сhoiceParameters/fromYAML"
import { getDefaults } from "./defaults"

export const importStandardAttributeDescriptionsFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: StandardAttributeDescriptionsYAML | undefined
): StandardAttributeDescriptions | undefined => {
  if (!data) return undefined

  const result: StandardAttributeDescriptions = []

  Object.entries(data).forEach(([name, value]) => {
    result.push(importStandardAttributeDescriptionFromYAML(context, undefined, value, name)!)
  })

  if (result.length === 0) return undefined

  return result
}

const importStandardAttributeDescriptionFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: StandardAttributeDescriptionYAML,
  name: string
): StandardAttributeDescription => {
  const result: StandardAttributeDescription = {
    name: StandartAttributeNameFromYAML(name),
  }

  const quickChoice = importSystemEnumerationFromYAMLDeprecated<SE.UseQuickChoice>(
    context,
    { type: "SystemEnumeration", typeSE: "UseQuickChoice" },
    data.БыстрыйВыбор
  )
  if (quickChoice) result.quickChoice = quickChoice

  const markNegatives = importBooleanFromYAML(context, undefined, data.ВыделятьОтрицательные)
  if (markNegatives !== undefined) result.markNegatives = markNegatives

  const fillFromFillingValue = importBooleanFromYAML(context, undefined, data.ЗаполнятьИзДанныхЗаполнения)
  if (fillFromFillingValue !== undefined) result.fillFromFillingValue = fillFromFillingValue

  const fillValue = importMetadataValueFromYAML(context, undefined, data.ЗначениеЗаполнения)
  if (fillValue) result.fillValue = fillValue

  const choiceHistoryOnInput = importSystemEnumerationFromYAMLDeprecated<SE.ChoiceHistoryOnInput>(
    context,
    { type: "SystemEnumeration", typeSE: "ChoiceHistoryOnInput" },
    data.ИсторияВыбораПриВводе
  )
  if (choiceHistoryOnInput) result.choiceHistoryOnInput = choiceHistoryOnInput

  const dataHistory = importSystemEnumerationFromYAMLDeprecated<SE.DataHistoryUse>(
    context,
    { type: "SystemEnumeration", typeSE: "DataHistoryUse" },
    data.ИсторияДанных
  )
  if (dataHistory) result.dataHistory = dataHistory

  if (data.Комментарий) result.comment = data.Комментарий
  if (data.МаксимальноеЗначение !== undefined) result.maxValue = data.МаксимальноеЗначение
  if (data.Маска) result.mask = data.Маска
  if (data.МинимальноеЗначение !== undefined) result.minValue = data.МинимальноеЗначение

  const multiLine = importBooleanFromYAML(context, undefined, data.МногострочныйРежим)
  if (multiLine !== undefined) result.multiLine = multiLine

  const choiceParameters = importChoiceParametersFromYAML(context, undefined, data.ПараметрыВыбора)
  if (choiceParameters) result.choiceParameters = choiceParameters

  const toolTip = importI8nTextFromYAML({ context, rule: { type: "I8nText" }, value: data.Подсказка })
  if (toolTip) result.toolTip = toolTip

  const fullTextSearch = importSystemEnumerationFromYAMLDeprecated<SE.UseFullTextSearch>(
    context,
    { type: "SystemEnumeration", typeSE: "UseFullTextSearch" },
    data.ПолнотекстовыйПоиск
  )
  if (fullTextSearch) result.fullTextSearch = fullTextSearch

  const fillChecking = importSystemEnumerationFromYAMLDeprecated<SE.FillChecking>(
    context,
    { type: "SystemEnumeration", typeSE: "FillChecking" },
    data.ПроверкаЗаполнения
  )
  if (fillChecking) result.fillChecking = fillChecking

  const extendedEdit = importBooleanFromYAML(context, undefined, data.РасширенноеРедактирование)
  if (extendedEdit !== undefined) result.extendedEdit = extendedEdit

  const passwordMode = importBooleanFromYAML(context, undefined, data.РежимПароля)
  if (passwordMode !== undefined) result.passwordMode = passwordMode

  const typeReductionMode = importSystemEnumerationFromYAMLDeprecated<SE.TypeReductionMode>(
    context,
    { type: "SystemEnumeration", typeSE: "TypeReductionMode" },
    data.РежимСокращенияТипа
  )
  if (typeReductionMode) result.typeReductionMode = typeReductionMode

  const choiceParameterLinks = importChoiceParameterLinksFromYAML(context, undefined, data.СвязиПараметровВыбора)
  if (choiceParameterLinks) result.choiceParameterLinks = choiceParameterLinks

  const linkByType = importTypeLinkFromYAML(context, undefined, data.СвязьПоТипу)
  if (linkByType) result.linkByType = linkByType

  const synonym = importI8nTextFromYAML({ context, rule: { type: "I8nText" }, value: data.Синоним })
  if (synonym) result.synonym = synonym

  const createOnInput = importSystemEnumerationFromYAMLDeprecated<SE.CreateOnInput>(
    context,
    { type: "SystemEnumeration", typeSE: "CreateOnInput" },
    data.СозданиеПриВводе
  )
  if (createOnInput) result.createOnInput = createOnInput

  const type = importTypeDescriptionFromYAML(context, undefined, data.Тип)
  if (type) result.type = type

  if (data.ФормаВыбора) result.choiceForm = data.ФормаВыбора

  const format = importI8nTextFromYAML({ context, rule: { type: "I8nText" }, value: data.Формат })
  if (format) result.format = format

  const editFormat = importI8nTextFromYAML({ context, rule: { type: "I8nText" }, value: data.ФорматРедактирования })
  if (editFormat) result.editFormat = editFormat

  const defaults = getDefaults(context, result)
  return removeDefaults(result, defaults)
}

registerTypeRule("StandardAttributeDescription", "importFromYAML", importStandardAttributeDescriptionsFromYAML)
