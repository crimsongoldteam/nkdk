import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { exportI8nTextToEnterprise } from "~/metadata/commonObjects/i8nText/exportToEnterprise"
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
import { Context } from "~/metadata/context/types"
import { exportSystemEnumerationToEnterprise } from "~/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { isSynonymEqualToName } from "../../helpers/isSynonymEqualToName"
import { I8nTextEnterprise } from "../i8nText/types"
import { exportChoiceParametersToEnterprise } from "../сhoiceParameter/exportToEnterprise"

export const exportMetadataAttributesToEnterprise = (
  context: Context,
  data: MetadataAttributes | undefined
): MetadataAttributesEnterprise | undefined => {
  if (!data) return undefined

  return Object.fromEntries(
    data.map((value: MetadataAttribute) => [value.name, exportMetadataAttributeToEnterprise(context, value)!])
  )
}

const exportMetadataAttributeToEnterprise = (
  context: Context,
  data: MetadataAttribute
): MetadataAttributeEnterprise => {
  const type = exportTypeDescriptionToEnterprise(context, data.type)!

  let synonym = exportI8nTextToEnterprise(context, data.synonym)

  const excludeSynonym = isSynonymEqualToName(synonym, data.name)

  if (excludeSynonym) {
    synonym = undefined
  }

  if (canUseShortFormat(data, synonym)) {
    return type
  }

  const result: MetadataAttributeFullEnterprise = {
    Тип: type,
  }

  if (synonym !== undefined) result.Синоним = synonym

  const quickChoice = exportSystemEnumerationToEnterprise<SE.UseQuickChoiceEnterprise>(
    context,
    data.quickChoice,
    SE.UseQuickChoiceToEnterprise
  )
  if (quickChoice !== undefined) result.БыстрыйВыбор = quickChoice

  const choiceFoldersAndItems = exportSystemEnumerationToEnterprise<SE.FoldersAndItemsUseEnterprise>(
    context,
    data.choiceFoldersAndItems,
    SE.FoldersAndItemsUseToEnterprise
  )
  if (choiceFoldersAndItems !== undefined) result.ВыборГруппИЭлементов = choiceFoldersAndItems

  const markNegatives = exportBooleanToEnterprise(context, data.markNegatives)
  if (markNegatives !== undefined) result.ВыделятьОтрицательные = markNegatives

  const fillFromFillingValue = exportBooleanToEnterprise(context, data.fillFromFillingValue)
  if (fillFromFillingValue !== undefined) result.ЗаполнятьИзДанныхЗаполнения = fillFromFillingValue

  const fillValue = exportMetadataValueToEnterprise(context, data.fillValue)
  if (fillValue !== undefined) result.ЗначениеЗаполнения = fillValue

  const indexing = exportSystemEnumerationToEnterprise<SE.IndexingEnterprise>(
    context,
    data.indexing,
    SE.IndexingToEnterprise
  )
  if (indexing !== undefined) result.Индексирование = indexing

  const use = exportSystemEnumerationToEnterprise<SE.AttributeUseEnterprise>(
    context,
    data.use,
    SE.AttributeUseToEnterprise
  )
  if (use !== undefined) result.Использование = use

  const binaryDataStorageLocationUse = exportSystemEnumerationToEnterprise<SE.BinaryDataStorageLocationUseEnterprise>(
    context,
    data.binaryDataStorageLocationUse,
    SE.BinaryDataStorageLocationUseToEnterprise
  )
  if (binaryDataStorageLocationUse !== undefined)
    result.ИспользованиеХраненияВХранилищеДвоичныхДанных = binaryDataStorageLocationUse

  const choiceHistoryOnInput = exportSystemEnumerationToEnterprise<SE.ChoiceHistoryOnInputEnterprise>(
    context,
    data.choiceHistoryOnInput,
    SE.ChoiceHistoryOnInputToEnterprise
  )
  if (choiceHistoryOnInput !== undefined) result.ИсторияВыбораПриВводе = choiceHistoryOnInput

  const dataHistory = exportSystemEnumerationToEnterprise<SE.DataHistoryUseEnterprise>(
    context,
    data.dataHistory,
    SE.DataHistoryUseToEnterprise
  )
  if (dataHistory !== undefined) result.ИсторияДанных = dataHistory

  if (data.comment !== undefined) result.Комментарий = data.comment

  if (data.maxValue !== undefined) result.МаксимальноеЗначение = data.maxValue

  if (data.mask !== undefined) result.Маска = data.mask

  if (data.minValue !== undefined) result.МинимальноеЗначение = data.minValue

  const multiLine = exportBooleanToEnterprise(context, data.multiLine)
  if (multiLine !== undefined) result.МногострочныйРежим = multiLine

  const choiceParameters = exportChoiceParametersToEnterprise(context, data.choiceParameters)
  if (choiceParameters !== undefined) result.ПараметрыВыбора = choiceParameters

  const toolTip = exportI8nTextToEnterprise(context, data.toolTip)
  if (toolTip !== undefined) result.Подсказка = toolTip

  const binaryDataStorageLocationUseField = exportBooleanToEnterprise(context, data.binaryDataStorageLocationUseField)
  if (binaryDataStorageLocationUseField !== undefined)
    result.ПолеИспользованияХраненияВХранилищеДвоичныхДанных = binaryDataStorageLocationUseField

  const fullTextSearch = exportSystemEnumerationToEnterprise<SE.UseFullTextSearchEnterprise>(
    context,
    data.fullTextSearch,
    SE.UseFullTextSearchToEnterprise
  )
  if (fullTextSearch !== undefined) result.ПолнотекстовыйПоиск = fullTextSearch

  const fillChecking = exportSystemEnumerationToEnterprise<SE.FillCheckingEnterprise>(
    context,
    data.fillChecking,
    SE.FillCheckingToEnterprise
  )
  if (fillChecking !== undefined) result.ПроверкаЗаполнения = fillChecking

  const extendedEdit = exportBooleanToEnterprise(context, data.extendedEdit)
  if (extendedEdit !== undefined) result.РасширенноеРедактирование = extendedEdit

  const passwordMode = exportBooleanToEnterprise(context, data.passwordMode)
  if (passwordMode !== undefined) result.РежимПароля = passwordMode

  const choiceParameterLinks = exportChoiceParameterLinksToEnterprise(context, data.choiceParameterLinks)
  if (choiceParameterLinks !== undefined) result.СвязиПараметровВыбора = choiceParameterLinks

  const linkByType = exportTypeLinkToEnterprise(context, data.linkByType)
  if (linkByType !== undefined) result.СвязьПоТипу = linkByType

  const createOnInput = exportSystemEnumerationToEnterprise<SE.CreateOnInputEnterprise>(
    context,
    data.createOnInput,
    SE.CreateOnInputToEnterprise
  )
  if (createOnInput !== undefined) result.СозданиеПриВводе = createOnInput

  if (data.choiceForm !== undefined) result.ФормаВыбора = data.choiceForm

  const format = exportI8nTextToEnterprise(context, data.format)
  if (format !== undefined) result.Формат = format

  const editFormat = exportI8nTextToEnterprise(context, data.editFormat)
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
