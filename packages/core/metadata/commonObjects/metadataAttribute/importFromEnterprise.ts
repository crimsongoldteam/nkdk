import { importBooleanFromEnterprise } from "~/metadata/commonObjects/boolean/importFromEnterprise"
import {
  MetadataAttribute,
  MetadataAttributeEnterprise,
  MetadataAttributes,
  MetadataAttributesEnterprise,
} from "~/metadata/commonObjects/metadataAttribute/types"
import { importTypeDescriptionFromEnterprise } from "~/metadata/commonObjects/typeDescription/importFromEnterprise"
import { importChoiceParametersFromEnterprise } from "~/metadata/commonObjects/сhoiceParameter/importFromEnterprise"
import { importChoiceParameterLinksFromEnterprise } from "~/metadata/commonObjects/сhoiceParameterLinks/importFromEnterprise"
import { Context } from "~/metadata/context/types"
import { splitPascalCase } from "~/metadata/helpers/canConvertToPascalCase.ts"
import { removeDefaults } from "~/metadata/helpers/compactObject"
import { importSystemEnumerationFromEnterprise } from "~/metadata/systemEnumerations/importFromEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { importI8nTextFromEnterprise } from "../i8nText/importFromEnterprise.ts"
import { importMetadataValueFromEnterprise } from "../metadataValue/importFromEnterprise.ts"
import { importTypeLinkFromEnterprise } from "../typeLink/importFromEnterprise.ts"
import { getDefaultsAttribute } from "./defaults"

export const importMetadataAttributesFromEnterprise = (
  context: Context,
  data: MetadataAttributesEnterprise | undefined
): MetadataAttributes | undefined => {
  if (!data) return undefined

  return Object.entries(data)
    .map(([name, value]) => importMetadataAttributeFromEnterprise(context, value, name))
    .filter((item): item is MetadataAttribute => item !== undefined)
}

const importMetadataAttributeFromEnterprise = (
  context: Context,
  data: MetadataAttributeEnterprise,
  name: string
): MetadataAttribute => {
  if (typeof data === "string" || Array.isArray(data)) {
    const type = importTypeDescriptionFromEnterprise(context, data)
    if (!type) throw new Error("Type is required")

    return {
      name,
      type,
      synonym: { items: { [context.defaultLanguage]: splitPascalCase(name) } },
    }
  }

  const type = importTypeDescriptionFromEnterprise(context, data.Тип)!

  const synonym = importI8nTextFromEnterprise(context, data.Синоним) ?? {
    items: { [context.defaultLanguage]: splitPascalCase(name) },
  }

  const result: MetadataAttribute = {
    name,
    type,
    synonym,
  }

  const quickChoice = importSystemEnumerationFromEnterprise<SE.UseQuickChoice>(
    context,
    data.БыстрыйВыбор,
    SE.UseQuickChoiceFromEnterprise
  )
  if (quickChoice !== undefined) result.quickChoice = quickChoice

  const choiceFoldersAndItems = importSystemEnumerationFromEnterprise<SE.FoldersAndItemsUse>(
    context,
    data.ВыборГруппИЭлементов,
    SE.FoldersAndItemsUseFromEnterprise
  )
  if (choiceFoldersAndItems !== undefined) result.choiceFoldersAndItems = choiceFoldersAndItems

  const markNegatives = importBooleanFromEnterprise(context, data.ВыделятьОтрицательные)
  if (markNegatives !== undefined) result.markNegatives = markNegatives

  const fillFromFillingValue = importBooleanFromEnterprise(context, data.ЗаполнятьИзДанныхЗаполнения)
  if (fillFromFillingValue !== undefined) result.fillFromFillingValue = fillFromFillingValue

  const fillValue = importMetadataValueFromEnterprise(context, data.ЗначениеЗаполнения)
  if (fillValue !== undefined) result.fillValue = fillValue

  const indexing = importSystemEnumerationFromEnterprise<SE.Indexing>(
    context,
    data.Индексирование,
    SE.IndexingFromEnterprise
  )
  if (indexing !== undefined) result.indexing = indexing

  const use = importSystemEnumerationFromEnterprise<SE.AttributeUse>(
    context,
    data.Использование,
    SE.AttributeUseFromEnterprise
  )
  if (use !== undefined) result.use = use

  const binaryDataStorageLocationUse = importSystemEnumerationFromEnterprise<SE.BinaryDataStorageLocationUse>(
    context,
    data.ИспользованиеХраненияВХранилищеДвоичныхДанных,
    SE.BinaryDataStorageLocationUseFromEnterprise
  )
  if (binaryDataStorageLocationUse !== undefined) result.binaryDataStorageLocationUse = binaryDataStorageLocationUse

  const choiceHistoryOnInput = importSystemEnumerationFromEnterprise<SE.ChoiceHistoryOnInput>(
    context,
    data.ИсторияВыбораПриВводе,
    SE.ChoiceHistoryOnInputFromEnterprise
  )
  if (choiceHistoryOnInput !== undefined) result.choiceHistoryOnInput = choiceHistoryOnInput

  const dataHistory = importSystemEnumerationFromEnterprise<SE.DataHistoryUse>(
    context,
    data.ИсторияДанных,
    SE.DataHistoryUseFromEnterprise
  )
  if (dataHistory !== undefined) result.dataHistory = dataHistory

  if (data.Комментарий !== undefined) result.comment = data.Комментарий

  if (data.МаксимальноеЗначение !== undefined) result.maxValue = data.МаксимальноеЗначение

  if (data.Маска !== undefined) result.mask = data.Маска

  if (data.МинимальноеЗначение !== undefined) result.minValue = data.МинимальноеЗначение

  const multiLine = importBooleanFromEnterprise(context, data.МногострочныйРежим)
  if (multiLine !== undefined) result.multiLine = multiLine

  const choiceParameters = importChoiceParametersFromEnterprise(context, data.ПараметрыВыбора)
  if (choiceParameters !== undefined) result.choiceParameters = choiceParameters

  const toolTip = importI8nTextFromEnterprise(context, data.Подсказка)
  if (toolTip !== undefined) result.toolTip = toolTip

  const binaryDataStorageLocationUseField = importBooleanFromEnterprise(
    context,
    data.ПолеИспользованияХраненияВХранилищеДвоичныхДанных
  )
  if (binaryDataStorageLocationUseField !== undefined)
    result.binaryDataStorageLocationUseField = binaryDataStorageLocationUseField

  const fullTextSearch = importSystemEnumerationFromEnterprise<SE.UseFullTextSearch>(
    context,
    data.ПолнотекстовыйПоиск,
    SE.UseFullTextSearchFromEnterprise
  )
  if (fullTextSearch !== undefined) result.fullTextSearch = fullTextSearch

  // const objectBelonging = importSystemEnumerationFromEnterprise<SE.ObjectBelonging>(
  //   context,
  //   data.ПринадлежностьОбъекта,
  //   SE.ObjectBelongingFromEnterprise
  // )
  // if (objectBelonging !== undefined) result.objectBelonging = objectBelonging

  const fillChecking = importSystemEnumerationFromEnterprise<SE.FillChecking>(
    context,
    data.ПроверкаЗаполнения,
    SE.FillCheckingFromEnterprise
  )
  if (fillChecking !== undefined) result.fillChecking = fillChecking

  const extendedEdit = importBooleanFromEnterprise(context, data.РасширенноеРедактирование)
  if (extendedEdit !== undefined) result.extendedEdit = extendedEdit

  const passwordMode = importBooleanFromEnterprise(context, data.РежимПароля)
  if (passwordMode !== undefined) result.passwordMode = passwordMode

  const choiceParameterLinks = importChoiceParameterLinksFromEnterprise(context, data.СвязиПараметровВыбора)
  if (choiceParameterLinks !== undefined) result.choiceParameterLinks = choiceParameterLinks

  const linkByType = importTypeLinkFromEnterprise(context, data.СвязьПоТипу)
  if (linkByType !== undefined) result.linkByType = linkByType

  const createOnInput = importSystemEnumerationFromEnterprise<SE.CreateOnInput>(
    context,
    data.СозданиеПриВводе,
    SE.CreateOnInputFromEnterprise
  )
  if (createOnInput !== undefined) result.createOnInput = createOnInput

  if (data.ФормаВыбора !== undefined) result.choiceForm = data.ФормаВыбора

  const format = importI8nTextFromEnterprise(context, data.Формат)
  if (format !== undefined) result.format = format

  const editFormat = importI8nTextFromEnterprise(context, data.ФорматРедактирования)
  if (editFormat !== undefined) result.editFormat = editFormat

  const defaults = getDefaultsAttribute(context, result)
  return removeDefaults(result, defaults)
}
