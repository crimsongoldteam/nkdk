import { importBooleanFromEnterprise } from "~/metadata/commonObjects/boolean/importFromEnterprise"
import {
  FormAttribute,
  FormAttributeAdditionalColumn,
  FormAttributeColumn,
  FormAttributeColumnEnterprise,
  FormAttributeEnterprise,
  FormAttributes,
  FormAttributesEnterprise,
} from "~/metadata/commonObjects/formAttribute/types"
import { importTypeDescriptionFromEnterprise } from "~/metadata/commonObjects/typeDescription/importFromEnterprise"
import { importUserVisibleFromEnterprise } from "~/metadata/commonObjects/userVisible/importFromEnterprise"
import { UserEditKeysEnterprise, UserViewKeysEnterprise } from "~/metadata/commonObjects/userVisible/types"
import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { splitPascalCase } from "~/metadata/helpers/canConvertToPascalCase"
import { addDefaultLanguageNameToSynonym, isSynonymEqualToName } from "~/metadata/helpers/synonymHelpers"
import { importSystemEnumerationFromEnterprise } from "~/metadata/systemEnumerations/importFromEnterprise"
import { FillChecking, FillCheckingFromEnterprise } from "~/metadata/systemEnumerations/types"
import { importDynamicListFromEnterprise } from "../dynamicList/importFromEnterprise"
import { importFieldsListFromEnterprise } from "../fieldsList/importFromEnterprise"
import { importFunctionalOptionsFromEnterprise } from "../functionalOptionsProperty/importFromEnterprise"
import { importI8nTextFromEnterprise } from "../i8nText/importFromEnterprise"
import { I8nText, I8nTextEnterprise } from "../i8nText/types"

export const importFormAttributesFromEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  data: FormAttributesEnterprise | undefined
): FormAttributes | undefined => {
  if (!data) return undefined

  return Object.entries(data)
    .map(([name, value]) => importFormAttributeFromEnterprise(context, undefined, value, name))
    .filter((item): item is FormAttribute => item !== undefined)
}

const importFormAttributeFromEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  data: FormAttributeEnterprise | string | string[],
  name: string
): FormAttribute | undefined => {
  if (typeof data === "string" || Array.isArray(data)) {
    const type = importTypeDescriptionFromEnterprise(context, undefined, data)!

    return {
      name,
      valueType: type,
      title: { items: { [context.defaultLanguage]: splitPascalCase(name) } },
    }
  }

  const type = importTypeDescriptionFromEnterprise(context, undefined, data.Тип)

  const mainAttribute = importBooleanFromEnterprise(context, undefined, data.ОсновнойРеквизит)
  const title = computeTitleForImport(context, data.Заголовок, name, mainAttribute)

  const result: FormAttribute = {
    name,
    valueType: type!,
    title,
  }

  if (mainAttribute !== undefined) result.mainAttribute = mainAttribute
  const storedData = importBooleanFromEnterprise(context, undefined, data.СохраняемыеДанные)
  if (storedData !== undefined) result.storedData = storedData

  const fillCheck = importSystemEnumerationFromEnterprise<FillChecking>(
    context,
    undefined,
    data.ПроверкаЗаполнения,
    FillCheckingFromEnterprise
  )
  if (fillCheck) result.fillCheck = fillCheck

  const view = importUserVisibleFromEnterprise(
    context,
    undefined,
    data[UserViewKeysEnterprise.Allow] ?? (data[UserViewKeysEnterprise.Deny] ? undefined : data.РазрешитьИспользование),
    data[UserViewKeysEnterprise.Deny]
  )
  if (view) result.view = view

  const edit = importUserVisibleFromEnterprise(
    context,
    undefined,

    data[UserEditKeysEnterprise.Allow] ?? (data[UserEditKeysEnterprise.Deny] ? undefined : data.РазрешитьИспользование),
    data[UserEditKeysEnterprise.Deny]
  )
  if (edit) result.edit = edit

  if (data.ДинамическийСписок !== undefined) {
    const dynamicList = importDynamicListFromEnterprise(context, undefined, data.ДинамическийСписок)
    if (dynamicList !== undefined) result.settings = dynamicList
  } else {
    const settings = importTypeDescriptionFromEnterprise(context, undefined, data.ТипЗначения)
    if (settings !== undefined) result.settings = settings
  }

  if (data.Колонки) {
    result.columns = importFormAttributeColumnsFromEnterprise(context, undefined, data.Колонки)
  }

  if (data.ДополнительныеКолонки) {
    result.additionalColumns = importFormAttributeAdditionalColumnsFromEnterprise(
      context,
      undefined,
      data.ДополнительныеКолонки
    )
  }

  const functionalOptions = importFunctionalOptionsFromEnterprise(context, undefined, data.ФункциональныеОпции)
  if (functionalOptions) result.functionalOptions = functionalOptions

  const fieldsList = importFieldsListFromEnterprise(context, undefined, data.ИспользоватьВсегда)
  if (fieldsList) result.fieldsList = fieldsList

  const save = importFieldsListFromEnterprise(context, undefined, data.Сохранение)
  if (save) result.save = save

  return result
}

const importFormAttributeColumnsFromEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  data: Record<string, FormAttributeColumnEnterprise>
): FormAttributeColumn[] => {
  return Object.entries(data).map(([name, value]) =>
    importFormAttributeColumnFromEnterprise(context, undefined, value, name)
  )
}

const importFormAttributeColumnFromEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  data: FormAttributeColumnEnterprise,
  name: string
): FormAttributeColumn => {
  const column: FormAttributeColumn = {
    name,
    id: "", // Enterprise doesn't provide IDs
  }

  const title = importI8nTextFromEnterprise(context, undefined, data.Заголовок)
  if (title) column.title = title

  const type = importTypeDescriptionFromEnterprise(context, undefined, data.Тип)
  if (type) column.type = type

  const fillCheck = importSystemEnumerationFromEnterprise<FillChecking>(
    context,
    undefined,
    data.ПроверкаЗаполнения,
    FillCheckingFromEnterprise
  )
  if (fillCheck) column.fillCheck = fillCheck

  const view = importUserVisibleFromEnterprise(
    context,
    undefined,

    data[UserViewKeysEnterprise.Allow],
    data[UserViewKeysEnterprise.Deny]
  )
  if (view) column.view = view

  const edit = importUserVisibleFromEnterprise(
    context,
    undefined,
    data[UserEditKeysEnterprise.Allow],
    data[UserEditKeysEnterprise.Deny]
  )
  if (edit) column.edit = edit

  if (data.Колонки) {
    column.columns = importFormAttributeColumnsFromEnterprise(context, undefined, data.Колонки)
  }

  const functionalOptions = importFunctionalOptionsFromEnterprise(context, undefined, data.ФункциональныеОпции)
  if (functionalOptions) column.functionalOptions = functionalOptions

  return column
}

const importFormAttributeAdditionalColumnsFromEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  data: Record<string, Record<string, FormAttributeColumnEnterprise>>
): FormAttributeAdditionalColumn[] => {
  return Object.entries(data).map(([tableName, columns]) => ({
    table: tableName,
    columns: importFormAttributeColumnsFromEnterprise(context, undefined, columns),
  }))
}

/**
 * Вычисляет заголовок для импорта из enterprise с учетом mainAttribute.
 * Если mainAttribute = true:
 * - Если заголовок отсутствует - устанавливаем пустой заголовок ("")
 * - Если заголовок равен имени - сохраняем как есть
 * Иначе - обычная логика (добавляем имя как заголовок по умолчанию)
 */
const computeTitleForImport = (
  context: ConfigurationContext,
  titleEnterprise: I8nTextEnterprise | undefined,
  name: string,
  mainAttribute: boolean | undefined
): I8nText => {
  const defaultLanguage = context.defaultLanguage
  const importedTitle = importI8nTextFromEnterprise(context, undefined, titleEnterprise)

  // Если mainAttribute = true
  if (mainAttribute === true) {
    // Если заголовок отсутствует - устанавливаем пустой заголовок
    if (titleEnterprise === undefined) {
      return { items: { [defaultLanguage]: "" } }
    }
    // Если заголовок равен имени - сохраняем как есть (без добавления значения по умолчанию)
    if (isSynonymEqualToName(titleEnterprise, name)) {
      return importedTitle ?? { items: { [defaultLanguage]: "" } }
    }
  }

  // Обычная логика
  return addDefaultLanguageNameToSynonym(context, importedTitle, name)
}
