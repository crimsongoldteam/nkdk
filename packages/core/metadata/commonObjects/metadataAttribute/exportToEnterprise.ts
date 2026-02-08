import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { exportI8nTextToYAML } from "~/metadata/commonObjects/i8nText/exportToEnterprise"
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
import { exportSystemEnumerationToEnterprise } from "~/metadata/systemEnumerations/exportToEnterprise"
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
  const synonym = exportI8nTextToYAML(context, undefined, filteredSynonym)

  if (canUseShortFormat(data, synonym)) {
    return type
  }

  const result: MetadataAttributeFullEnterprise = {
    Тип: type,
  }

  if (synonym !== undefined) result.Синоним = synonym

  const quickChoice = exportSystemEnumerationToEnterprise(
    context,
    undefined,
    data.quickChoice,
    SE.UseQuickChoiceToEnterprise
  )
  if (quickChoice !== undefined) result.БыстрыйВыбор = quickChoice

  const choiceFoldersAndItems = exportSystemEnumerationToEnterprise(
    context,
    undefined,
    data.choiceFoldersAndItems,
    SE.FoldersAndItemsUseToEnterprise
  )
  if (choiceFoldersAndItems !== undefined) result.ВыборГруппИЭлементов = choiceFoldersAndItems

  const markNegatives = exportBooleanToEnterprise(context, undefined, data.markNegatives)
  if (markNegatives !== undefined) result.ВыделятьОтрицательные = markNegatives

  const fillFromFillingValue = exportBooleanToEnterprise(context, undefined, data.fillFromFillingValue)
  if (fillFromFillingValue !== undefined) result.ЗаполнятьИзДанныхЗаполнения = fillFromFillingValue

  const fillValue = exportMetadataValueToEnterprise(context, undefined, data.fillValue)
  if (fillValue !== undefined) result.ЗначениеЗаполнения = fillValue

  const indexing = exportSystemEnumerationToEnterprise(context, undefined, data.indexing, SE.IndexingToEnterprise)
  if (indexing !== undefined) result.Индексирование = indexing

  const use = exportSystemEnumerationToEnterprise(context, undefined, data.use, SE.AttributeUseToEnterprise)
  if (use !== undefined) result.Использование = use

  const binaryDataStorageLocationUse = exportSystemEnumerationToEnterprise(
    context,
    undefined,
    data.binaryDataStorageLocationUse,
    SE.BinaryDataStorageLocationUseToEnterprise
  )
  if (binaryDataStorageLocationUse !== undefined)
    result.ИспользованиеХраненияВХранилищеДвоичныхДанных = binaryDataStorageLocationUse

  const choiceHistoryOnInput = exportSystemEnumerationToEnterprise(
    context,
    undefined,
    data.choiceHistoryOnInput,
    SE.ChoiceHistoryOnInputToEnterprise
  )
  if (choiceHistoryOnInput !== undefined) result.ИсторияВыбораПриВводе = choiceHistoryOnInput

  const dataHistory = exportSystemEnumerationToEnterprise(
    context,
    undefined,
    data.dataHistory,
    SE.DataHistoryUseToEnterprise
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

  const toolTip = exportI8nTextToYAML(context, undefined, data.toolTip)
  if (toolTip !== undefined) result.Подсказка = toolTip

  const binaryDataStorageLocationUseField = exportBooleanToEnterprise(
    context,
    undefined,
    data.binaryDataStorageLocationUseField
  )
  if (binaryDataStorageLocationUseField !== undefined)
    result.ПолеИспользованияХраненияВХранилищеДвоичныхДанных = binaryDataStorageLocationUseField

  const fullTextSearch = exportSystemEnumerationToEnterprise(
    context,
    undefined,
    data.fullTextSearch,
    SE.UseFullTextSearchToEnterprise
  )
  if (fullTextSearch !== undefined) result.ПолнотекстовыйПоиск = fullTextSearch

  const fillChecking = exportSystemEnumerationToEnterprise(
    context,
    undefined,
    data.fillChecking,
    SE.FillCheckingToEnterprise
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

  const createOnInput = exportSystemEnumerationToEnterprise(
    context,
    undefined,
    data.createOnInput,
    SE.CreateOnInputToEnterprise
  )
  if (createOnInput !== undefined) result.СозданиеПриВводе = createOnInput

  if (data.choiceForm !== undefined) result.ФормаВыбора = data.choiceForm

  const format = exportI8nTextToYAML(context, undefined, data.format)
  if (format !== undefined) result.Формат = format

  const editFormat = exportI8nTextToYAML(context, undefined, data.editFormat)
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
