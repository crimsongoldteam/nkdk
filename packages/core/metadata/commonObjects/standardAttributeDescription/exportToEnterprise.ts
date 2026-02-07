import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { exportI8nTextToYAML } from "~/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportMetadataValueToEnterprise } from "~/metadata/commonObjects/metadataValue/exportToEnterprise"
import {
  StandardAttributeDescription,
  StandardAttributeDescriptionEnterprise,
  StandardAttributeDescriptions,
  StandardAttributeDescriptionsEnterprise,
  StandartAttributeEnterprise,
  StandartAttributeName,
  StandartAttributeNameToEnterprise,
} from "~/metadata/commonObjects/standardAttributeDescription/types"
import { exportTypeDescriptionToEnterprise } from "~/metadata/commonObjects/typeDescription/exportToEnterprise"
import { exportTypeLinkToEnterprise } from "~/metadata/commonObjects/typeLink/exportToEnterprise"
import { exportChoiceParameterLinksToEnterprise } from "~/metadata/commonObjects/сhoiceParameterLinks/exportToEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { exportSystemEnumerationToEnterprise } from "~/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { exportChoiceParametersToEnterprise } from "../сhoiceParameters/exportToEnterprise"

export const exportStandartAttributeNameToEnterprise = (name: StandartAttributeName): StandartAttributeEnterprise => {
  return StandartAttributeNameToEnterprise[name]
}

export const exportStandardAttributeDescriptionsToEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: StandardAttributeDescriptions | undefined
): StandardAttributeDescriptionsEnterprise | undefined => {
  if (!data) return undefined

  const result: StandardAttributeDescriptionsEnterprise = Object.fromEntries(
    data.map((value: StandardAttributeDescription) => [
      StandartAttributeNameToEnterprise[value.name],
      exportStandardAttributeDescriptionToEnterprise(context, undefined, value)!,
    ])
  )

  if (Object.keys(result).length === 0) return undefined

  return result
}

const exportStandardAttributeDescriptionToEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: StandardAttributeDescription
): StandardAttributeDescriptionEnterprise => {
  const result: StandardAttributeDescriptionEnterprise = {}

  const quickChoice = exportSystemEnumerationToEnterprise(
    context,
    undefined,
    data.quickChoice,
    SE.UseQuickChoiceToEnterprise
  )
  if (quickChoice) result.БыстрыйВыбор = quickChoice

  const markNegatives = exportBooleanToEnterprise(context, undefined, data.markNegatives)
  if (markNegatives !== undefined) result.ВыделятьОтрицательные = markNegatives

  const fillFromFillingValue = exportBooleanToEnterprise(context, undefined, data.fillFromFillingValue)
  if (fillFromFillingValue !== undefined) result.ЗаполнятьИзДанныхЗаполнения = fillFromFillingValue

  const fillValue = exportMetadataValueToEnterprise(context, undefined, data.fillValue)
  if (fillValue) result.ЗначениеЗаполнения = fillValue

  const choiceHistoryOnInput = exportSystemEnumerationToEnterprise(
    context,
    undefined,
    data.choiceHistoryOnInput,
    SE.ChoiceHistoryOnInputToEnterprise
  )
  if (choiceHistoryOnInput) result.ИсторияВыбораПриВводе = choiceHistoryOnInput

  const dataHistory = exportSystemEnumerationToEnterprise(
    context,
    undefined,
    data.dataHistory,
    SE.DataHistoryUseToEnterprise
  )
  if (dataHistory) result.ИсторияДанных = dataHistory

  if (data.comment) result.Комментарий = data.comment
  if (data.maxValue !== undefined) result.МаксимальноеЗначение = data.maxValue
  if (data.mask) result.Маска = data.mask
  if (data.minValue !== undefined) result.МинимальноеЗначение = data.minValue

  const multiLine = exportBooleanToEnterprise(context, undefined, data.multiLine)
  if (multiLine !== undefined) result.МногострочныйРежим = multiLine

  const choiceParameters = exportChoiceParametersToEnterprise(context, undefined, data.choiceParameters)
  if (choiceParameters) result.ПараметрыВыбора = choiceParameters

  const toolTip = exportI8nTextToYAML(context, undefined, data.toolTip)
  if (toolTip) result.Подсказка = toolTip

  const fullTextSearch = exportSystemEnumerationToEnterprise(
    context,
    undefined,
    data.fullTextSearch,
    SE.UseFullTextSearchToEnterprise
  )
  if (fullTextSearch) result.ПолнотекстовыйПоиск = fullTextSearch

  const fillChecking = exportSystemEnumerationToEnterprise(
    context,
    undefined,
    data.fillChecking,
    SE.FillCheckingToEnterprise
  )
  if (fillChecking) result.ПроверкаЗаполнения = fillChecking

  const extendedEdit = exportBooleanToEnterprise(context, undefined, data.extendedEdit)
  if (extendedEdit !== undefined) result.РасширенноеРедактирование = extendedEdit

  const passwordMode = exportBooleanToEnterprise(context, undefined, data.passwordMode)
  if (passwordMode !== undefined) result.РежимПароля = passwordMode

  const typeReductionMode = exportSystemEnumerationToEnterprise(
    context,
    undefined,
    data.typeReductionMode,
    SE.TypeReductionModeToEnterprise
  )
  if (typeReductionMode) result.РежимСокращенияТипа = typeReductionMode

  const choiceParameterLinks = exportChoiceParameterLinksToEnterprise(context, undefined, data.choiceParameterLinks)
  if (choiceParameterLinks) result.СвязиПараметровВыбора = choiceParameterLinks

  const linkByType = exportTypeLinkToEnterprise(context, undefined, data.linkByType)
  if (linkByType) result.СвязьПоТипу = linkByType

  const synonym = exportI8nTextToYAML(context, undefined, data.synonym)
  if (synonym) result.Синоним = synonym

  const createOnInput = exportSystemEnumerationToEnterprise(
    context,
    undefined,
    data.createOnInput,
    SE.CreateOnInputToEnterprise
  )
  if (createOnInput) result.СозданиеПриВводе = createOnInput

  const type = exportTypeDescriptionToEnterprise(context, undefined, data.type)
  if (type) result.Тип = type

  if (data.choiceForm) result.ФормаВыбора = data.choiceForm

  const format = exportI8nTextToYAML(context, undefined, data.format)
  if (format) result.Формат = format

  const editFormat = exportI8nTextToYAML(context, undefined, data.editFormat)
  if (editFormat) result.ФорматРедактирования = editFormat

  return result
}
