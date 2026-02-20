import { exportBooleanToYAML } from "~/metadata/commonObjects/boolean/toYAML"
import { exportI8nTextToYAML } from "~/metadata/commonObjects/i8nText/toYAML"
import { exportMetadataValueToYAML } from "~/metadata/commonObjects/metadataValue/toYAML"
import {
  StandardAttributeDescription,
  StandardAttributeDescriptionYAML,
  StandardAttributeDescriptions,
  StandardAttributeDescriptionsYAML,
  StandartAttributeName,
  StandartAttributeNameToYAML,
  StandartAttributeYAML,
} from "~/metadata/commonObjects/standardAttributeDescription/types"
import { exportTypeDescriptionToYAML } from "~/metadata/commonObjects/typeDescription/toYAML"
import { exportTypeLinkToYAML } from "~/metadata/commonObjects/typeLink/toYAML"
import { exportChoiceParameterLinksToYAML } from "~/metadata/commonObjects/сhoiceParameterLinks/toYAML"
import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory"
import { exportSystemEnumerationToYAMLDeprecated } from "~/metadata/systemEnumerations/toYAML"
import * as SE from "~/metadata/systemEnumerations/types"
import { exportChoiceParametersToYAML } from "../сhoiceParameters/toYAML"

export const exportStandartAttributeNameToYAML = (name: StandartAttributeName): StandartAttributeYAML => {
  return StandartAttributeNameToYAML[name]
}

export const exportStandardAttributeDescriptionsToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  data: StandardAttributeDescriptions | undefined
): StandardAttributeDescriptionsYAML | undefined => {
  if (!data) return undefined

  const result: StandardAttributeDescriptionsYAML = Object.fromEntries(
    data.map((value: StandardAttributeDescription) => [
      StandartAttributeNameToYAML[value.name],
      exportStandardAttributeDescriptionToYAML(context, undefined, value)!,
    ])
  )

  if (Object.keys(result).length === 0) return undefined

  return result
}

const exportStandardAttributeDescriptionToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  data: StandardAttributeDescription
): StandardAttributeDescriptionYAML => {
  const result: StandardAttributeDescriptionYAML = {}

  const quickChoice = exportSystemEnumerationToYAMLDeprecated<SE.UseQuickChoiceYAML>(
    context,
    { type: "SystemEnumeration", typeSE: "UseQuickChoice" },
    data.quickChoice
  )
  if (quickChoice) result.БыстрыйВыбор = quickChoice

  const markNegatives = exportBooleanToYAML(context, undefined, data.markNegatives)
  if (markNegatives !== undefined) result.ВыделятьОтрицательные = markNegatives

  const fillFromFillingValue = exportBooleanToYAML(context, undefined, data.fillFromFillingValue)
  if (fillFromFillingValue !== undefined) result.ЗаполнятьИзДанныхЗаполнения = fillFromFillingValue

  const fillValue = exportMetadataValueToYAML(context, undefined, data.fillValue)
  if (fillValue) result.ЗначениеЗаполнения = fillValue

  const choiceHistoryOnInput = exportSystemEnumerationToYAMLDeprecated<SE.ChoiceHistoryOnInputYAML>(
    context,
    { type: "SystemEnumeration", typeSE: "ChoiceHistoryOnInput" },
    data.choiceHistoryOnInput
  )
  if (choiceHistoryOnInput) result.ИсторияВыбораПриВводе = choiceHistoryOnInput

  const dataHistory = exportSystemEnumerationToYAMLDeprecated<SE.DataHistoryUseYAML>(
    context,
    { type: "SystemEnumeration", typeSE: "DataHistoryUse" },
    data.dataHistory
  )
  if (dataHistory) result.ИсторияДанных = dataHistory

  if (data.comment) result.Комментарий = data.comment
  if (data.maxValue !== undefined) result.МаксимальноеЗначение = data.maxValue
  if (data.mask) result.Маска = data.mask
  if (data.minValue !== undefined) result.МинимальноеЗначение = data.minValue

  const multiLine = exportBooleanToYAML(context, undefined, data.multiLine)
  if (multiLine !== undefined) result.МногострочныйРежим = multiLine

  const choiceParameters = exportChoiceParametersToYAML(context, undefined, data.choiceParameters)
  if (choiceParameters) result.ПараметрыВыбора = choiceParameters

  const toolTip = exportI8nTextToYAML({ context, rule: { type: "I8nText" }, value: data.toolTip })
  if (toolTip) result.Подсказка = toolTip

  const fullTextSearch = exportSystemEnumerationToYAMLDeprecated<SE.UseFullTextSearchYAML>(
    context,
    { type: "SystemEnumeration", typeSE: "UseFullTextSearch" },
    data.fullTextSearch
  )
  if (fullTextSearch) result.ПолнотекстовыйПоиск = fullTextSearch

  const fillChecking = exportSystemEnumerationToYAMLDeprecated<SE.FillCheckingYAML>(
    context,
    { type: "SystemEnumeration", typeSE: "FillChecking" },
    data.fillChecking
  )
  if (fillChecking) result.ПроверкаЗаполнения = fillChecking

  const extendedEdit = exportBooleanToYAML(context, undefined, data.extendedEdit)
  if (extendedEdit !== undefined) result.РасширенноеРедактирование = extendedEdit

  const passwordMode = exportBooleanToYAML(context, undefined, data.passwordMode)
  if (passwordMode !== undefined) result.РежимПароля = passwordMode

  const typeReductionMode = exportSystemEnumerationToYAMLDeprecated<SE.TypeReductionModeYAML>(
    context,
    { type: "SystemEnumeration", typeSE: "TypeReductionMode" },
    data.typeReductionMode
  )
  if (typeReductionMode) result.РежимСокращенияТипа = typeReductionMode

  const choiceParameterLinks = exportChoiceParameterLinksToYAML(context, undefined, data.choiceParameterLinks)
  if (choiceParameterLinks) result.СвязиПараметровВыбора = choiceParameterLinks

  const linkByType = exportTypeLinkToYAML(context, undefined, data.linkByType)
  if (linkByType) result.СвязьПоТипу = linkByType

  const synonym = exportI8nTextToYAML({ context, rule: { type: "I8nText" }, value: data.synonym })
  if (synonym) result.Синоним = synonym

  const createOnInput = exportSystemEnumerationToYAMLDeprecated<SE.CreateOnInputYAML>(
    context,
    { type: "SystemEnumeration", typeSE: "CreateOnInput" },
    data.createOnInput
  )
  if (createOnInput) result.СозданиеПриВводе = createOnInput

  const type = exportTypeDescriptionToYAML(context, undefined, data.type)
  if (type) result.Тип = type

  if (data.choiceForm) result.ФормаВыбора = data.choiceForm

  const format = exportI8nTextToYAML({ context, rule: { type: "I8nText" }, value: data.format })
  if (format) result.Формат = format

  const editFormat = exportI8nTextToYAML({ context, rule: { type: "I8nText" }, value: data.editFormat })
  if (editFormat) result.ФорматРедактирования = editFormat

  return result
}

registerTypeRule("StandardAttributeDescription", "exportToYAML", exportStandardAttributeDescriptionsToYAML)
