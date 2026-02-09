import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { exportI8nTextToYAML } from "~/metadata/commonObjects/i8nText/toYAML"
import {
  MetadataAttribute,
  MetadataAttributeEnterprise,
  MetadataAttributeFullEnterprise,
  MetadataAttributes,
  MetadataAttributesEnterprise,
} from "~/metadata/commonObjects/metadataAttribute/types"
import { exportMetadataValueToEnterprise } from "~/metadata/commonObjects/metadataValue/exportToEnterprise"
import { exportTypeDescriptionToEnterprise } from "~/metadata/commonObjects/typeDescription/exportToEnterprise"
import { exportTypeLinkToEnterprise } from "~/metadata/commonObjects/typeLink/exportToEnterprise"
import { exportChoiceParameterLinksToEnterprise } from "~/metadata/commonObjects/сhoiceParameterLinks/exportToEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { exportSystemEnumerationToYAML } from "~/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { extractDifferentSynonymPart } from "../../helpers/synonymHelpers"
import { I8nTextEnterprise } from "../i8nText/types"
import { exportChoiceParametersToEnterprise } from "../сhoiceParameters/exportToEnterprise"

export const exportMetadataAttributesToEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  data: MetadataAttributes | undefined
): MetadataAttributesEnterprise | undefined => {
  if (!data) return undefined

  return Object.fromEntries(
    data.map((value: MetadataAttribute) => [
      value.name,
      exportMetadataAttributeToEnterprise(context, undefined, value)!,
    ])
  )
}

const exportMetadataAttributeToEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  data: MetadataAttribute
): MetadataAttributeEnterprise => {
  const type = exportTypeDescriptionToEnterprise(context, undefined, data.type)!

  const filteredSynonym = extractDifferentSynonymPart(context, data.synonym, data.name)
  const synonym = exportI8nTextToYAML(context, { type: "I8nText" }, filteredSynonym)

  if (canUseShortFormat(data, synonym)) {
    return type
  }

  const result: MetadataAttributeFullEnterprise = {
    Тип: type,
  }

  if (synonym !== undefined) result.Синоним = synonym

  const quickChoice = exportSystemEnumerationToYAML<SE.UseQuickChoiceEnterprise>(
    context,
    { type: "SystemEnumeration", typeSE: "UseQuickChoice" },
    data.quickChoice
  )
  if (quickChoice !== undefined) result.БыстрыйВыбор = quickChoice

  const choiceFoldersAndItems = exportSystemEnumerationToYAML<SE.FoldersAndItemsUseEnterprise>(
    context,
    { type: "SystemEnumeration", typeSE: "FoldersAndItemsUse" },
    data.choiceFoldersAndItems
  )
  if (choiceFoldersAndItems !== undefined) result.ВыборГруппИЭлементов = choiceFoldersAndItems

  const markNegatives = exportBooleanToEnterprise(context, undefined, data.markNegatives)
  if (markNegatives !== undefined) result.ВыделятьОтрицательные = markNegatives

  const fillFromFillingValue = exportBooleanToEnterprise(context, undefined, data.fillFromFillingValue)
  if (fillFromFillingValue !== undefined) result.ЗаполнятьИзДанныхЗаполнения = fillFromFillingValue

  const fillValue = exportMetadataValueToEnterprise(context, undefined, data.fillValue)
  if (fillValue !== undefined) result.ЗначениеЗаполнения = fillValue

  const indexing = exportSystemEnumerationToYAML<SE.IndexingEnterprise>(
    context,
    { type: "SystemEnumeration", typeSE: "Indexing" },
    data.indexing
  )
  if (indexing !== undefined) result.Индексирование = indexing

  const use = exportSystemEnumerationToYAML<SE.AttributeUseEnterprise>(
    context,
    { type: "SystemEnumeration", typeSE: "AttributeUse" },
    data.use
  )
  if (use !== undefined) result.Использование = use

  const binaryDataStorageLocationUse = exportSystemEnumerationToYAML<SE.BinaryDataStorageLocationUseEnterprise>(
    context,
    { type: "SystemEnumeration", typeSE: "BinaryDataStorageLocationUse" },
    data.binaryDataStorageLocationUse
  )
  if (binaryDataStorageLocationUse !== undefined)
    result.ИспользованиеХраненияВХранилищеДвоичныхДанных = binaryDataStorageLocationUse

  const choiceHistoryOnInput = exportSystemEnumerationToYAML<SE.ChoiceHistoryOnInputEnterprise>(
    context,
    { type: "SystemEnumeration", typeSE: "ChoiceHistoryOnInput" },
    data.choiceHistoryOnInput
  )
  if (choiceHistoryOnInput !== undefined) result.ИсторияВыбораПриВводе = choiceHistoryOnInput

  const dataHistory = exportSystemEnumerationToYAML<SE.DataHistoryUseEnterprise>(
    context,
    { type: "SystemEnumeration", typeSE: "DataHistoryUse" },
    data.dataHistory
  )
  if (dataHistory !== undefined) result.ИсторияДанных = dataHistory

  if (data.comment !== undefined) result.Комментарий = data.comment

  if (data.maxValue !== undefined) result.МаксимальноеЗначение = data.maxValue

  if (data.mask !== undefined) result.Маска = data.mask

  if (data.minValue !== undefined) result.МинимальноеЗначение = data.minValue

  const multiLine = exportBooleanToEnterprise(context, undefined, data.multiLine)
  if (multiLine !== undefined) result.МногострочныйРежим = multiLine

  const choiceParameters = exportChoiceParametersToEnterprise(context, undefined, data.choiceParameters)
  if (choiceParameters !== undefined) result.ПараметрыВыбора = choiceParameters

  const toolTip = exportI8nTextToYAML(context, { type: "I8nText" }, data.toolTip)
  if (toolTip !== undefined) result.Подсказка = toolTip

  const binaryDataStorageLocationUseField = exportBooleanToEnterprise(
    context,
    undefined,
    data.binaryDataStorageLocationUseField
  )
  if (binaryDataStorageLocationUseField !== undefined)
    result.ПолеИспользованияХраненияВХранилищеДвоичныхДанных = binaryDataStorageLocationUseField

  const fullTextSearch = exportSystemEnumerationToYAML<SE.UseFullTextSearchEnterprise>(
    context,
    { type: "SystemEnumeration", typeSE: "UseFullTextSearch" },
    data.fullTextSearch
  )
  if (fullTextSearch !== undefined) result.ПолнотекстовыйПоиск = fullTextSearch

  const fillChecking = exportSystemEnumerationToYAML<SE.FillCheckingEnterprise>(
    context,
    { type: "SystemEnumeration", typeSE: "FillChecking" },
    data.fillChecking
  )
  if (fillChecking !== undefined) result.ПроверкаЗаполнения = fillChecking

  const extendedEdit = exportBooleanToEnterprise(context, undefined, data.extendedEdit)
  if (extendedEdit !== undefined) result.РасширенноеРедактирование = extendedEdit

  const passwordMode = exportBooleanToEnterprise(context, undefined, data.passwordMode)
  if (passwordMode !== undefined) result.РежимПароля = passwordMode

  const choiceParameterLinks = exportChoiceParameterLinksToEnterprise(context, undefined, data.choiceParameterLinks)
  if (choiceParameterLinks !== undefined) result.СвязиПараметровВыбора = choiceParameterLinks

  const linkByType = exportTypeLinkToEnterprise(context, undefined, data.linkByType)
  if (linkByType !== undefined) result.СвязьПоТипу = linkByType

  const createOnInput = exportSystemEnumerationToYAML<SE.CreateOnInputEnterprise>(
    context,
    { type: "SystemEnumeration", typeSE: "CreateOnInput" },
    data.createOnInput
  )
  if (createOnInput !== undefined) result.СозданиеПриВводе = createOnInput

  if (data.choiceForm !== undefined) result.ФормаВыбора = data.choiceForm

  const format = exportI8nTextToYAML(context, { type: "I8nText" }, data.format)
  if (format !== undefined) result.Формат = format

  const editFormat = exportI8nTextToYAML(context, { type: "I8nText" }, data.editFormat)
  if (editFormat !== undefined) result.ФорматРедактирования = editFormat

  return result as MetadataAttributeEnterprise
}

const canUseShortFormat = (data: MetadataAttribute, synonym: I8nTextEnterprise | undefined): boolean => {
  if (synonym !== undefined) return false
  const filteredData = Object.fromEntries(
    Object.entries(data).filter(([key, value]) => value !== undefined && !["name", "type", "synonym"].includes(key))
  )
  return Object.keys(filteredData).length === 0
}
