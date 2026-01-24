import { importBooleanFromEnterprise } from "~/metadata/commonObjects/boolean/importFromEnterprise"
import {
  FormAttribute,
  FormAttributeColumn,
  FormAttributeColumnEnterprise,
  FormAttributeEnterprise,
  FormAttributes,
  FormAttributesEnterprise,
} from "~/metadata/commonObjects/formAttribute/types"
import { importTypeDescriptionFromEnterprise } from "~/metadata/commonObjects/typeDescription/importFromEnterprise"
import { importUserVisibleFromEnterprise } from "~/metadata/commonObjects/userVisible/importFromEnterprise"
import { UserVisibleKeysEnterprise } from "~/metadata/commonObjects/userVisible/types"
import { ConfigurationContext } from "~/metadata/context/types"
import { splitPascalCase } from "~/metadata/helpers/canConvertToPascalCase"
import { addDefaultLanguageNameToSynonym, isSynonymEqualToName } from "~/metadata/helpers/synonymHelpers"
import { importSystemEnumerationFromEnterprise } from "~/metadata/systemEnumerations/importFromEnterprise"
import { FillChecking, FillCheckingFromEnterprise } from "~/metadata/systemEnumerations/types"
import { importDynamicListFromEnterprise } from "../dynamicList/importFromEnterprise"
import { importFunctionalOptionsFromEnterprise } from "../functionalOptionsProperty/importFromEnterprise"
import { importI8nTextFromEnterprise } from "../i8nText/importFromEnterprise"
import { I8nText, I8nTextEnterprise } from "../i8nText/types"
import { importUseAlwaysFromEnterprise } from "../useAlways/importFromEnterprise"

export const importFormAttributesFromEnterprise = (
  context: ConfigurationContext,
  data: FormAttributesEnterprise | undefined
): FormAttributes | undefined => {
  if (!data) return undefined

  return Object.entries(data)
    .map(([name, value]) => importFormAttributeFromEnterprise(context, value, name))
    .filter((item): item is FormAttribute => item !== undefined)
}

const importFormAttributeFromEnterprise = (
  context: ConfigurationContext,
  data: FormAttributeEnterprise | string | string[],
  name: string
): FormAttribute | undefined => {
  if (typeof data === "string" || Array.isArray(data)) {
    const type = importTypeDescriptionFromEnterprise(context, data)!

    return {
      name,
      valueType: type,
      title: { items: { [context.defaultLanguage]: splitPascalCase(name) } },
    }
  }

  const type = importTypeDescriptionFromEnterprise(context, data.Тип)

  const mainAttribute = importBooleanFromEnterprise(context, data.ОсновнойРеквизит)
  const title = computeTitleForImport(context, data.Заголовок, name, mainAttribute)

  const result: FormAttribute = {
    name,
    valueType: type!,
    title,
  }

  if (mainAttribute !== undefined) result.mainAttribute = mainAttribute
  const storedData = importBooleanFromEnterprise(context, data.СохраняемыеДанные)
  if (storedData !== undefined) result.storedData = storedData

  const fillCheck = importSystemEnumerationFromEnterprise<FillChecking>(
    context,
    data.ПроверкаЗаполнения,
    FillCheckingFromEnterprise
  )
  if (fillCheck) result.fillCheck = fillCheck

  if (data.ДинамическийСписок !== undefined) {
    const dynamicList = importDynamicListFromEnterprise(context, data.ДинамическийСписок)
    if (dynamicList !== undefined) result.settings = dynamicList
  } else {
    const settings = importTypeDescriptionFromEnterprise(context, data.ТипЗначения)
    if (settings !== undefined) result.settings = settings
  }

  const use = importUserVisibleFromEnterprise(
    context,
    data[UserVisibleKeysEnterprise.Allow] || data[UserVisibleKeysEnterprise.Deny],
    data[UserVisibleKeysEnterprise.Allow]
      ? UserVisibleKeysEnterprise.Allow
      : data[UserVisibleKeysEnterprise.Deny]
        ? UserVisibleKeysEnterprise.Deny
        : undefined
  )
  if (use !== undefined) result.use = use

  if (data.Колонки) {
    result.columns = importFormAttributeColumnsFromEnterprise(context, data.Колонки)
  }

  const functionalOptions = importFunctionalOptionsFromEnterprise(context, data.ФункциональныеОпции)
  if (functionalOptions) result.functionalOptions = functionalOptions

  const useAlways = importUseAlwaysFromEnterprise(context, data.ИспользоватьВсегда)
  if (useAlways) result.useAlways = useAlways

  return result
}

const importFormAttributeColumnsFromEnterprise = (
  context: ConfigurationContext,
  data: Record<string, FormAttributeColumnEnterprise>
): FormAttributeColumn[] => {
  return Object.entries(data).map(([name, value]) => importFormAttributeColumnFromEnterprise(context, value, name))
}

const importFormAttributeColumnFromEnterprise = (
  context: ConfigurationContext,
  data: FormAttributeColumnEnterprise,
  name: string
): FormAttributeColumn => {
  const column: FormAttributeColumn = {
    name,
    id: "", // Enterprise doesn't provide IDs
  }

  const title = importI8nTextFromEnterprise(context, data.Заголовок)
  if (title) column.title = title

  const type = importTypeDescriptionFromEnterprise(context, data.Тип)
  if (type) column.type = type

  const fillCheck = importSystemEnumerationFromEnterprise<FillChecking>(
    context,
    data.ПроверкаЗаполнения,
    FillCheckingFromEnterprise
  )
  if (fillCheck) column.fillCheck = fillCheck

  const view = importUserVisibleFromEnterprise(
    context,
    data[UserVisibleKeysEnterprise.AllowView] || data[UserVisibleKeysEnterprise.DenyView],
    data[UserVisibleKeysEnterprise.AllowView]
      ? UserVisibleKeysEnterprise.AllowView
      : data[UserVisibleKeysEnterprise.DenyView]
        ? UserVisibleKeysEnterprise.DenyView
        : undefined
  )
  if (view) column.view = view

  const edit = importUserVisibleFromEnterprise(
    context,
    data[UserVisibleKeysEnterprise.AllowEdit] || data[UserVisibleKeysEnterprise.DenyEdit],
    data[UserVisibleKeysEnterprise.AllowEdit]
      ? UserVisibleKeysEnterprise.AllowEdit
      : data[UserVisibleKeysEnterprise.DenyEdit]
        ? UserVisibleKeysEnterprise.DenyEdit
        : undefined
  )
  if (edit) column.edit = edit

  if (data.Колонки) {
    column.columns = importFormAttributeColumnsFromEnterprise(context, data.Колонки)
  }

  const functionalOptions = importFunctionalOptionsFromEnterprise(context, data.ФункциональныеОпции)
  if (functionalOptions) column.functionalOptions = functionalOptions

  return column
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
  const importedTitle = importI8nTextFromEnterprise(context, titleEnterprise)

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
