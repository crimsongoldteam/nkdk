import { importBooleanFromYAML } from "~/metadata/commonObjects/boolean/fromYAML"
import {
    MetadataAttribute,
    MetadataAttributeYAML,
    MetadataAttributes,
    MetadataAttributesYAML,
} from "~/metadata/commonObjects/metadataAttribute/types"
import { importTypeDescriptionFromYAML } from "~/metadata/commonObjects/typeDescription/fromYAML"
import { importChoiceParameterLinksFromYAML } from "~/metadata/commonObjects/сhoiceParameterLinks/fromYAML"
import { importChoiceParametersFromYAML } from "~/metadata/commonObjects/сhoiceParameters/fromYAML.ts"
import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules.ts"
import { splitPascalCase } from "~/metadata/helpers/canConvertToPascalCase.ts"
import { removeDefaults } from "~/metadata/helpers/compactObject"
import { addDefaultLanguageNameToSynonym } from "~/metadata/helpers/synonymHelpers.ts"
import { registerTypeRule } from "~/metadata/metadataFactory/index.ts"
import {
    importSystemEnumerationFromYAML,
    importSystemEnumerationFromYAMLDeprecated,
} from "~/metadata/systemEnumerations/fromYAML"
import * as SE from "~/metadata/systemEnumerations/types"
import { importI8nTextFromYAML } from "../i8nText/fromYAML.ts"
import { importMetadataValueFromYAML } from "../metadataValue/fromYAML.ts"
import { importTypeLinkFromYAML } from "../typeLink/fromYAML.ts"
import { getDefaultsAttribute } from "./defaults"

export const importMetadataAttributesFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataAttributesYAML | undefined
): MetadataAttributes | undefined => {
  if (!data) return undefined

  return Object.entries(data)
    .map(([name, value]) => importMetadataAttributeFromYAML(context, undefined, value, name))
    .filter((item): item is MetadataAttribute => item !== undefined)
}

const importMetadataAttributeFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataAttributeYAML,
  name: string
): MetadataAttribute => {
  if (typeof data === "string" || Array.isArray(data)) {
    const type = importTypeDescriptionFromYAML(context, undefined, data)
    if (!type) throw new Error("Type is required")

    return {
      name,
      type,
      synonym: { items: { [context.defaultLanguage]: splitPascalCase(name) } },
    }
  }

  const type = importTypeDescriptionFromYAML(context, undefined, data.Тип)!

  const synonym = addDefaultLanguageNameToSynonym(
    context,
    importI8nTextFromYAML({ context, rule: { type: "I8nText" }, value: data.Синоним }),
    name
  )

  const result: MetadataAttribute = {
    name,
    type,
    synonym,
  }

  const quickChoice = importSystemEnumerationFromYAMLDeprecated<SE.UseQuickChoice>(
    context,
    { type: "SystemEnumeration", typeSE: "UseQuickChoice" },
    data.БыстрыйВыбор
  )
  if (quickChoice !== undefined) result.quickChoice = quickChoice

  const choiceFoldersAndItems = importSystemEnumerationFromYAMLDeprecated<SE.FoldersAndItemsUse>(
    context,
    { type: "SystemEnumeration", typeSE: "FoldersAndItemsUse" },
    data.ВыборГруппИЭлементов
  )
  if (choiceFoldersAndItems !== undefined) result.choiceFoldersAndItems = choiceFoldersAndItems

  const markNegatives = importBooleanFromYAML(context, undefined, data.ВыделятьОтрицательные)
  if (markNegatives !== undefined) result.markNegatives = markNegatives

  const fillFromFillingValue = importBooleanFromYAML(context, undefined, data.ЗаполнятьИзДанныхЗаполнения)
  if (fillFromFillingValue !== undefined) result.fillFromFillingValue = fillFromFillingValue

  const fillValue = importMetadataValueFromYAML(context, undefined, data.ЗначениеЗаполнения)
  if (fillValue !== undefined) result.fillValue = fillValue

  const indexing = importSystemEnumerationFromYAMLDeprecated<SE.Indexing>(
    context,
    { type: "SystemEnumeration", typeSE: "Indexing" },
    data.Индексирование
  )
  if (indexing !== undefined) result.indexing = indexing

  const use = importSystemEnumerationFromYAMLDeprecated<SE.AttributeUse>(
    context,
    { type: "SystemEnumeration", typeSE: "AttributeUse" },
    data.Использование
  )
  if (use !== undefined) result.use = use

  const binaryDataStorageLocationUse = importSystemEnumerationFromYAMLDeprecated<SE.BinaryDataStorageLocationUse>(
    context,
    { type: "SystemEnumeration", typeSE: "BinaryDataStorageLocationUse" },
    data.ИспользованиеХраненияВХранилищеДвоичныхДанных
  )
  if (binaryDataStorageLocationUse !== undefined) result.binaryDataStorageLocationUse = binaryDataStorageLocationUse

  const choiceHistoryOnInput = importSystemEnumerationFromYAMLDeprecated<SE.ChoiceHistoryOnInput>(
    context,
    { type: "SystemEnumeration", typeSE: "ChoiceHistoryOnInput" },
    data.ИсторияВыбораПриВводе
  )
  if (choiceHistoryOnInput !== undefined) result.choiceHistoryOnInput = choiceHistoryOnInput

  const dataHistory = importSystemEnumerationFromYAMLDeprecated<SE.DataHistoryUse>(
    context,
    { type: "SystemEnumeration", typeSE: "DataHistoryUse" },
    data.ИсторияДанных
  )
  if (dataHistory !== undefined) result.dataHistory = dataHistory

  if (data.Комментарий !== undefined) result.comment = data.Комментарий

  if (data.МаксимальноеЗначение !== undefined) result.maxValue = data.МаксимальноеЗначение

  if (data.Маска !== undefined) result.mask = data.Маска

  if (data.МинимальноеЗначение !== undefined) result.minValue = data.МинимальноеЗначение

  const multiLine = importBooleanFromYAML(context, undefined, data.МногострочныйРежим)
  if (multiLine !== undefined) result.multiLine = multiLine

  const choiceParameters = importChoiceParametersFromYAML(context, undefined, data.ПараметрыВыбора)
  if (choiceParameters !== undefined) result.choiceParameters = choiceParameters

  const toolTip = importI8nTextFromYAML({ context, rule: { type: "I8nText" }, value: data.Подсказка })
  if (toolTip !== undefined) result.toolTip = toolTip

  const binaryDataStorageLocationUseField = importBooleanFromYAML(
    context,
    undefined,
    data.ПолеИспользованияХраненияВХранилищеДвоичныхДанных
  )
  if (binaryDataStorageLocationUseField !== undefined)
    result.binaryDataStorageLocationUseField = binaryDataStorageLocationUseField

  const fullTextSearch = importSystemEnumerationFromYAMLDeprecated<SE.UseFullTextSearch>(
    context,
    { type: "SystemEnumeration", typeSE: "UseFullTextSearch" },
    data.ПолнотекстовыйПоиск
  )
  if (fullTextSearch !== undefined) result.fullTextSearch = fullTextSearch

  // const objectBelonging = importSystemEnumerationFromYAML<SE.ObjectBelonging>(
  //   context,
  //   data.ПринадлежностьОбъекта,
  //   SE.ObjectBelongingFromYAML
  // )
  // if (objectBelonging !== undefined) result.objectBelonging = objectBelonging

  const fillChecking = importSystemEnumerationFromYAML<SE.FillChecking>({
    context,
    rule: { type: "SystemEnumeration", typeSE: "FillChecking" },
    value: data.ПроверкаЗаполнения,
  })

  if (fillChecking !== undefined) result.fillChecking = fillChecking

  const extendedEdit = importBooleanFromYAML(context, undefined, data.РасширенноеРедактирование)
  if (extendedEdit !== undefined) result.extendedEdit = extendedEdit

  const passwordMode = importBooleanFromYAML(context, undefined, data.РежимПароля)
  if (passwordMode !== undefined) result.passwordMode = passwordMode

  const choiceParameterLinks = importChoiceParameterLinksFromYAML(context, undefined, data.СвязиПараметровВыбора)
  if (choiceParameterLinks !== undefined) result.choiceParameterLinks = choiceParameterLinks

  const linkByType = importTypeLinkFromYAML(context, undefined, data.СвязьПоТипу)
  if (linkByType !== undefined) result.linkByType = linkByType

  const createOnInput = importSystemEnumerationFromYAMLDeprecated<SE.CreateOnInput>(
    context,
    { type: "SystemEnumeration", typeSE: "CreateOnInput" },
    data.СозданиеПриВводе
  )
  if (createOnInput !== undefined) result.createOnInput = createOnInput

  if (data.ФормаВыбора !== undefined) result.choiceForm = data.ФормаВыбора

  const format = importI8nTextFromYAML({ context, rule: { type: "I8nText" }, value: data.Формат })
  if (format !== undefined) result.format = format

  const editFormat = importI8nTextFromYAML({ context, rule: { type: "I8nText" }, value: data.ФорматРедактирования })
  if (editFormat !== undefined) result.editFormat = editFormat

  const defaults = getDefaultsAttribute(context, result)
  return removeDefaults(result, defaults)
}

registerTypeRule("MetadataAttributes", "importFromYAML", importMetadataAttributesFromYAML)
