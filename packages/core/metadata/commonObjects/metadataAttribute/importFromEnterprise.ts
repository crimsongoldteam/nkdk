import { importBooleanFromEnterprise } from "~/metadata/commonObjects/boolean/importFromEnterprise"
import {
  MetadataAttribute,
  MetadataAttributeEnterprise,
  MetadataAttributes,
  MetadataAttributesEnterprise,
} from "~/metadata/commonObjects/metadataAttribute/types"
import { importTypeDescriptionFromEnterprise } from "~/metadata/commonObjects/typeDescription/importFromEnterprise"
import { importChoiceParameterLinksFromEnterprise } from "~/metadata/commonObjects/сhoiceParameterLinks/importFromEnterprise"
import { importChoiceParametersFromEnterprise } from "~/metadata/commonObjects/сhoiceParameters/importFromEnterprise.ts"
import { ConfigurationContext } from "~/metadata/context/types"
import { splitPascalCase } from "~/metadata/helpers/canConvertToPascalCase.ts"
import { removeDefaults } from "~/metadata/helpers/compactObject"
import { addDefaultLanguageNameToSynonym } from "~/metadata/helpers/synonymHelpers.ts"
import { importSystemEnumerationFromYAML } from "~/metadata/systemEnumerations/importFromEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { importI8nTextFromEnterprise } from "../i8nText/importFromEnterprise.ts"
import { importMetadataValueFromEnterprise } from "../metadataValue/importFromEnterprise.ts"
import { importTypeLinkFromEnterprise } from "../typeLink/importFromEnterprise.ts"
import { getDefaultsAttribute } from "./defaults"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules.ts"

export const importMetadataAttributesFromEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataAttributesEnterprise | undefined
): MetadataAttributes | undefined => {
  if (!data) return undefined

  return Object.entries(data)
    .map(([name, value]) => importMetadataAttributeFromEnterprise(context, undefined, value, name))
    .filter((item): item is MetadataAttribute => item !== undefined)
}

const importMetadataAttributeFromEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataAttributeEnterprise,
  name: string
): MetadataAttribute => {
  if (typeof data === "string" || Array.isArray(data)) {
    const type = importTypeDescriptionFromEnterprise(context, undefined, data)
    if (!type) throw new Error("Type is required")

    return {
      name,
      type,
      synonym: { items: { [context.defaultLanguage]: splitPascalCase(name) } },
    }
  }

  const type = importTypeDescriptionFromEnterprise(context, undefined, data.Тип)!

  const synonym = addDefaultLanguageNameToSynonym(
    context,
    importI8nTextFromEnterprise(context, undefined, data.Синоним),
    name
  )

  const result: MetadataAttribute = {
    name,
    type,
    synonym,
  }

  const quickChoice = importSystemEnumerationFromYAML<SE.UseQuickChoice>(
    context,
    data.БыстрыйВыбор,
    SE.UseQuickChoiceFromEnterprise
  )
  if (quickChoice !== undefined) result.quickChoice = quickChoice

  const choiceFoldersAndItems = importSystemEnumerationFromYAML<SE.FoldersAndItemsUse>(
    context,
    data.ВыборГруппИЭлементов,
    SE.FoldersAndItemsUseFromEnterprise
  )
  if (choiceFoldersAndItems !== undefined) result.choiceFoldersAndItems = choiceFoldersAndItems

  const markNegatives = importBooleanFromEnterprise(context, undefined, data.ВыделятьОтрицательные)
  if (markNegatives !== undefined) result.markNegatives = markNegatives

  const fillFromFillingValue = importBooleanFromEnterprise(context, undefined, data.ЗаполнятьИзДанныхЗаполнения)
  if (fillFromFillingValue !== undefined) result.fillFromFillingValue = fillFromFillingValue

  const fillValue = importMetadataValueFromEnterprise(context, undefined, data.ЗначениеЗаполнения)
  if (fillValue !== undefined) result.fillValue = fillValue

  const indexing = importSystemEnumerationFromYAML<SE.Indexing>(context, data.Индексирование, SE.IndexingFromEnterprise)
  if (indexing !== undefined) result.indexing = indexing

  const use = importSystemEnumerationFromYAML<SE.AttributeUse>(
    context,
    data.Использование,
    SE.AttributeUseFromEnterprise
  )
  if (use !== undefined) result.use = use

  const binaryDataStorageLocationUse = importSystemEnumerationFromYAML<SE.BinaryDataStorageLocationUse>(
    context,
    data.ИспользованиеХраненияВХранилищеДвоичныхДанных,
    SE.BinaryDataStorageLocationUseFromEnterprise
  )
  if (binaryDataStorageLocationUse !== undefined) result.binaryDataStorageLocationUse = binaryDataStorageLocationUse

  const choiceHistoryOnInput = importSystemEnumerationFromYAML<SE.ChoiceHistoryOnInput>(
    context,
    data.ИсторияВыбораПриВводе,
    SE.ChoiceHistoryOnInputFromEnterprise
  )
  if (choiceHistoryOnInput !== undefined) result.choiceHistoryOnInput = choiceHistoryOnInput

  const dataHistory = importSystemEnumerationFromYAML<SE.DataHistoryUse>(
    context,
    data.ИсторияДанных,
    SE.DataHistoryUseFromEnterprise
  )
  if (dataHistory !== undefined) result.dataHistory = dataHistory

  if (data.Комментарий !== undefined) result.comment = data.Комментарий

  if (data.МаксимальноеЗначение !== undefined) result.maxValue = data.МаксимальноеЗначение

  if (data.Маска !== undefined) result.mask = data.Маска

  if (data.МинимальноеЗначение !== undefined) result.minValue = data.МинимальноеЗначение

  const multiLine = importBooleanFromEnterprise(context, undefined, data.МногострочныйРежим)
  if (multiLine !== undefined) result.multiLine = multiLine

  const choiceParameters = importChoiceParametersFromEnterprise(context, undefined, data.ПараметрыВыбора)
  if (choiceParameters !== undefined) result.choiceParameters = choiceParameters

  const toolTip = importI8nTextFromEnterprise(context, undefined, data.Подсказка)
  if (toolTip !== undefined) result.toolTip = toolTip

  const binaryDataStorageLocationUseField = importBooleanFromEnterprise(
    context,
    data.ПолеИспользованияХраненияВХранилищеДвоичныхДанных
  )
  if (binaryDataStorageLocationUseField !== undefined)
    result.binaryDataStorageLocationUseField = binaryDataStorageLocationUseField

  const fullTextSearch = importSystemEnumerationFromYAML<SE.UseFullTextSearch>(
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

  const fillChecking = importSystemEnumerationFromYAML<SE.FillChecking>(
    context,
    data.ПроверкаЗаполнения,
    SE.FillCheckingFromEnterprise
  )
  if (fillChecking !== undefined) result.fillChecking = fillChecking

  const extendedEdit = importBooleanFromEnterprise(context, undefined, data.РасширенноеРедактирование)
  if (extendedEdit !== undefined) result.extendedEdit = extendedEdit

  const passwordMode = importBooleanFromEnterprise(context, undefined, data.РежимПароля)
  if (passwordMode !== undefined) result.passwordMode = passwordMode

  const choiceParameterLinks = importChoiceParameterLinksFromEnterprise(context, undefined, data.СвязиПараметровВыбора)
  if (choiceParameterLinks !== undefined) result.choiceParameterLinks = choiceParameterLinks

  const linkByType = importTypeLinkFromEnterprise(context, undefined, data.СвязьПоТипу)
  if (linkByType !== undefined) result.linkByType = linkByType

  const createOnInput = importSystemEnumerationFromYAML<SE.CreateOnInput>(
    context,
    data.СозданиеПриВводе,
    SE.CreateOnInputFromEnterprise
  )
  if (createOnInput !== undefined) result.createOnInput = createOnInput

  if (data.ФормаВыбора !== undefined) result.choiceForm = data.ФормаВыбора

  const format = importI8nTextFromEnterprise(context, undefined, data.Формат)
  if (format !== undefined) result.format = format

  const editFormat = importI8nTextFromEnterprise(context, undefined, data.ФорматРедактирования)
  if (editFormat !== undefined) result.editFormat = editFormat

  const defaults = getDefaultsAttribute(context, result)
  return removeDefaults(result, defaults)
}
