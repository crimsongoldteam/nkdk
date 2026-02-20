import { exportBooleanToYAML } from "~/metadata/commonObjects/boolean/toYAML"
import { exportI8nTextToYAML } from "~/metadata/commonObjects/i8nText/toYAML"
import {
  MetadataAttribute,
  MetadataAttributeFullYAML,
  MetadataAttributes,
  MetadataAttributesYAML,
  MetadataAttributeYAML,
} from "~/metadata/commonObjects/metadataAttribute/types"
import { exportMetadataValueToYAML } from "~/metadata/commonObjects/metadataValue/toYAML"
import { exportTypeDescriptionToYAML } from "~/metadata/commonObjects/typeDescription/toYAML"
import { exportTypeLinkToYAML } from "~/metadata/commonObjects/typeLink/toYAML"
import { exportChoiceParameterLinksToYAML } from "~/metadata/commonObjects/сhoiceParameterLinks/toYAML"
import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory"
import { exportSystemEnumerationToYAML } from "~/metadata/systemEnumerations/toYAML"
import * as SE from "~/metadata/systemEnumerations/types"
import { excludeNameFromI8nText } from "../../helpers/synonymHelpers"
import { I8nTextYAML } from "../i8nText/types"
import { exportChoiceParametersToYAML } from "../сhoiceParameters/toYAML"

export const exportMetadataAttributesToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  data: MetadataAttributes | undefined
): MetadataAttributesYAML | undefined => {
  if (!data) return undefined

  return Object.fromEntries(
    data.map((value: MetadataAttribute) => [value.name, exportMetadataAttributeToYAML(context, undefined, value)!])
  )
}

const exportMetadataAttributeToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  data: MetadataAttribute
): MetadataAttributeYAML => {
  const type = exportTypeDescriptionToYAML(context, undefined, data.type)!

  const filteredSynonym = excludeNameFromI8nText(context, data.synonym, data.name)
  const synonym = exportI8nTextToYAML({
    context,
    rule: { type: "I8nText" },
    value: filteredSynonym,
    name: data.name,
  })

  if (canUseShortFormat(data, synonym)) {
    return type
  }

  const result: MetadataAttributeFullYAML = {
    Тип: type,
  }

  if (synonym !== undefined) result.Синоним = synonym

  const quickChoice = exportSystemEnumerationToYAML<SE.UseQuickChoiceYAML>(
    context,
    { type: "SystemEnumeration", typeSE: "UseQuickChoice" },
    data.quickChoice
  )
  if (quickChoice !== undefined) result.БыстрыйВыбор = quickChoice

  const choiceFoldersAndItems = exportSystemEnumerationToYAML<SE.FoldersAndItemsUseYAML>(
    context,
    { type: "SystemEnumeration", typeSE: "FoldersAndItemsUse" },
    data.choiceFoldersAndItems
  )
  if (choiceFoldersAndItems !== undefined) result.ВыборГруппИЭлементов = choiceFoldersAndItems

  const markNegatives = exportBooleanToYAML(context, undefined, data.markNegatives)
  if (markNegatives !== undefined) result.ВыделятьОтрицательные = markNegatives

  const fillFromFillingValue = exportBooleanToYAML(context, undefined, data.fillFromFillingValue)
  if (fillFromFillingValue !== undefined) result.ЗаполнятьИзДанныхЗаполнения = fillFromFillingValue

  const fillValue = exportMetadataValueToYAML(context, undefined, data.fillValue)
  if (fillValue !== undefined) result.ЗначениеЗаполнения = fillValue

  const indexing = exportSystemEnumerationToYAML<SE.IndexingYAML>(
    context,
    { type: "SystemEnumeration", typeSE: "Indexing" },
    data.indexing
  )
  if (indexing !== undefined) result.Индексирование = indexing

  const use = exportSystemEnumerationToYAML<SE.AttributeUseYAML>(
    context,
    { type: "SystemEnumeration", typeSE: "AttributeUse" },
    data.use
  )
  if (use !== undefined) result.Использование = use

  const binaryDataStorageLocationUse = exportSystemEnumerationToYAML<SE.BinaryDataStorageLocationUseYAML>(
    context,
    { type: "SystemEnumeration", typeSE: "BinaryDataStorageLocationUse" },
    data.binaryDataStorageLocationUse
  )
  if (binaryDataStorageLocationUse !== undefined)
    result.ИспользованиеХраненияВХранилищеДвоичныхДанных = binaryDataStorageLocationUse

  const choiceHistoryOnInput = exportSystemEnumerationToYAML<SE.ChoiceHistoryOnInputYAML>(
    context,
    { type: "SystemEnumeration", typeSE: "ChoiceHistoryOnInput" },
    data.choiceHistoryOnInput
  )
  if (choiceHistoryOnInput !== undefined) result.ИсторияВыбораПриВводе = choiceHistoryOnInput

  const dataHistory = exportSystemEnumerationToYAML<SE.DataHistoryUseYAML>(
    context,
    { type: "SystemEnumeration", typeSE: "DataHistoryUse" },
    data.dataHistory
  )
  if (dataHistory !== undefined) result.ИсторияДанных = dataHistory

  if (data.comment !== undefined) result.Комментарий = data.comment

  if (data.maxValue !== undefined) result.МаксимальноеЗначение = data.maxValue

  if (data.mask !== undefined) result.Маска = data.mask

  if (data.minValue !== undefined) result.МинимальноеЗначение = data.minValue

  const multiLine = exportBooleanToYAML(context, undefined, data.multiLine)
  if (multiLine !== undefined) result.МногострочныйРежим = multiLine

  const choiceParameters = exportChoiceParametersToYAML(context, undefined, data.choiceParameters)
  if (choiceParameters !== undefined) result.ПараметрыВыбора = choiceParameters

  const toolTip = exportI8nTextToYAML({
    context,
    rule: { type: "I8nText" },
    value: data.toolTip,
    name: data.name,
  })
  if (toolTip !== undefined) result.Подсказка = toolTip

  const binaryDataStorageLocationUseField = exportBooleanToYAML(
    context,
    undefined,
    data.binaryDataStorageLocationUseField
  )
  if (binaryDataStorageLocationUseField !== undefined)
    result.ПолеИспользованияХраненияВХранилищеДвоичныхДанных = binaryDataStorageLocationUseField

  const fullTextSearch = exportSystemEnumerationToYAML<SE.UseFullTextSearchYAML>(
    context,
    { type: "SystemEnumeration", typeSE: "UseFullTextSearch" },
    data.fullTextSearch
  )
  if (fullTextSearch !== undefined) result.ПолнотекстовыйПоиск = fullTextSearch

  const fillChecking = exportSystemEnumerationToYAML<SE.FillCheckingYAML>(
    context,
    { type: "SystemEnumeration", typeSE: "FillChecking" },
    data.fillChecking
  )
  if (fillChecking !== undefined) result.ПроверкаЗаполнения = fillChecking

  const extendedEdit = exportBooleanToYAML(context, undefined, data.extendedEdit)
  if (extendedEdit !== undefined) result.РасширенноеРедактирование = extendedEdit

  const passwordMode = exportBooleanToYAML(context, undefined, data.passwordMode)
  if (passwordMode !== undefined) result.РежимПароля = passwordMode

  const choiceParameterLinks = exportChoiceParameterLinksToYAML(context, undefined, data.choiceParameterLinks)
  if (choiceParameterLinks !== undefined) result.СвязиПараметровВыбора = choiceParameterLinks

  const linkByType = exportTypeLinkToYAML(context, undefined, data.linkByType)
  if (linkByType !== undefined) result.СвязьПоТипу = linkByType

  const createOnInput = exportSystemEnumerationToYAML<SE.CreateOnInputYAML>(
    context,
    { type: "SystemEnumeration", typeSE: "CreateOnInput" },
    data.createOnInput
  )
  if (createOnInput !== undefined) result.СозданиеПриВводе = createOnInput

  if (data.choiceForm !== undefined) result.ФормаВыбора = data.choiceForm

  const format = exportI8nTextToYAML({
    context,
    rule: { type: "I8nText" },
    value: data.format,
    name: data.name,
  })
  if (format !== undefined) result.Формат = format

  const editFormat = exportI8nTextToYAML({
    context,
    rule: { type: "I8nText" },
    value: data.editFormat,
    name: data.name,
  })
  if (editFormat !== undefined) result.ФорматРедактирования = editFormat

  return result as MetadataAttributeYAML
}

const canUseShortFormat = (data: MetadataAttribute, synonym: I8nTextYAML | undefined): boolean => {
  if (synonym !== undefined) return false
  const filteredData = Object.fromEntries(
    Object.entries(data).filter(([key, value]) => value !== undefined && !["name", "type", "synonym"].includes(key))
  )
  return Object.keys(filteredData).length === 0
}

registerTypeRule("MetadataAttributes", "exportToYAML", exportMetadataAttributesToYAML)
