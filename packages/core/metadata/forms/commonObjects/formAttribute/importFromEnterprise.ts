import { importI8nTextFromEnterprise } from "~/metadata/commonObjects/i8nText/importFromEnterprise"
import { I8nText, I8nTextEnterprise } from "~/metadata/commonObjects/i8nText/types"
import { TypeDescriptionEnterprise } from "~/metadata/commonObjects/typeDescription/types"
import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { addDefaultLanguageNameToSynonym, isSynonymEqualToName } from "~/metadata/helpers/synonymHelpers"
import { importPropertiesFromYAML, registerTypeRule } from "~/metadata/metadataFactory"
import { FormAttributeColumnRules, FormAttributeRules } from "./rules"
import {
  FormAttribute,
  FormAttributeAdditionalColumn,
  FormAttributeColumn,
  FormAttributeColumnEnterprise,
  FormAttributeEnterprise,
  FormAttributes,
  FormAttributesEnterprise,
} from "./types"

export const importFormAttributesFromEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  data: FormAttributesEnterprise | undefined
): FormAttributes | undefined => {
  if (!data) return undefined

  return Object.entries(data).map(([name, value]) => importFormAttributeFromEnterprise(context, value, name))
}

const importFormAttributeFromEnterprise = (
  context: ConfigurationContext,
  data: FormAttributeEnterprise,
  name: string
): FormAttribute | TypeDescriptionEnterprise => {
  const properties = importPropertiesFromYAML({
    context: context,
    yaml: data,
    metadataType: "FormAttribute",
    rules: FormAttributeRules,
  })

  const result: FormAttribute = {
    ...properties,
    name,
  }

  return result

  // if (typeof data === "string" || Array.isArray(data)) {
  //   const type = importTypeDescriptionFromEnterprise(context, undefined, data)!

  //   return {
  //     name,
  //     valueType: type,
  //     title: { items: { [context.defaultLanguage]: splitPascalCase(name) } },
  //   }
  // }

  // const type = importTypeDescriptionFromEnterprise(context, undefined, data.Тип)

  // const mainAttribute = importBooleanFromEnterprise(context, undefined, data.ОсновнойРеквизит)
  // const title = computeTitleForImport(context, data.Заголовок, name, mainAttribute)

  // const result: FormAttribute = {
  //   name,
  //   valueType: type!,
  //   title,
  // }

  // if (mainAttribute !== undefined) result.mainAttribute = mainAttribute
  // const storedData = importBooleanFromEnterprise(context, undefined, data.СохраняемыеДанные)
  // if (storedData !== undefined) result.storedData = storedData

  // const fillCheck = importSystemEnumerationFromYAML<FillChecking>(
  //   context,
  //   { type: "SystemEnumeration", typeSE: "FillChecking" },
  //   data.ПроверкаЗаполнения
  // )
  // if (fillCheck) result.fillCheck = fillCheck

  // const view = importUserVisibleFromEnterprise(
  //   context,
  //   undefined,
  //   data[UserViewKeysEnterprise.Allow] ?? (data[UserViewKeysEnterprise.Deny] ? undefined : data.РазрешитьИспользование),
  //   data[UserViewKeysEnterprise.Deny]
  // )
  // if (view) result.view = view

  // const edit = importUserVisibleFromYAML(
  //   context,
  //   { type: "UserVisible", yaml: UserEditKeysEnterprise.Allow, yamlDeny: UserEditKeysEnterprise.Deny },
  //   data[UserEditKeysEnterprise.Allow],
  //   data[UserEditKeysEnterprise.Deny]
  // )
  // if (edit) result.edit = edit

  // if (data.ДинамическийСписок !== undefined) {
  //   const dynamicList = importDynamicListFromEnterprise(context, undefined, data.ДинамическийСписок)
  //   if (dynamicList !== undefined) result.settings = dynamicList
  // } else {
  //   const settings = importTypeDescriptionFromEnterprise(context, undefined, data.ТипЗначения)
  //   if (settings !== undefined) result.settings = settings
  // }

  // if (data.Колонки) {
  //   result.columns = importFormAttributeColumnsFromEnterprise(context, undefined, data.Колонки)
  // }

  // if (data.ДополнительныеКолонки) {
  //   result.additionalColumns = importFormAttributeAdditionalColumnsFromEnterprise(
  //     context,
  //     undefined,
  //     data.ДополнительныеКолонки
  //   )
  // }

  // const functionalOptions = importFunctionalOptionsFromEnterprise(context, undefined, data.ФункциональныеОпции)
  // if (functionalOptions) result.functionalOptions = functionalOptions

  // const fieldsList = importFieldsListFromEnterprise(context, undefined, data.ИспользоватьВсегда)
  // if (fieldsList) result.fieldsList = fieldsList

  // const save = importFieldsListFromEnterprise(context, undefined, data.Сохранение)
  // if (save) result.save = save

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
  const properties = importPropertiesFromYAML({
    context: context,
    yaml: data,
    metadataType: "FormAttributeColumn",
    rules: FormAttributeColumnRules,
  })

  const result: FormAttributeColumn = {
    ...properties,
    name,
  }

  return result
  // const column: FormAttributeColumn = {
  //   name,
  //   id: "", // Enterprise doesn't provide IDs
  // }

  // const title = importI8nTextFromEnterprise(context, { type: "I8nText" }, data.Заголовок)
  // if (title) column.title = title

  // const type = importTypeDescriptionFromEnterprise(context, undefined, data.Тип)
  // if (type) column.type = type

  // const fillCheck = importSystemEnumerationFromYAML<FillChecking>(
  //   context,
  //   { type: "SystemEnumeration", typeSE: "FillChecking" },
  //   data.ПроверкаЗаполнения
  // )
  // if (fillCheck) column.fillCheck = fillCheck

  // const view = importUserVisibleFromEnterprise(
  //   context,
  //   undefined,

  //   data[UserViewKeysEnterprise.Allow],
  //   data[UserViewKeysEnterprise.Deny]
  // )
  // if (view) column.view = view

  // const edit = importUserVisibleFromEnterprise(
  //   context,
  //   undefined,
  //   data[UserEditKeysEnterprise.Allow],
  //   data[UserEditKeysEnterprise.Deny]
  // )
  // if (edit) column.edit = edit

  // if (data.Колонки) {
  //   column.columns = importFormAttributeColumnsFromEnterprise(context, undefined, data.Колонки)
  // }

  // const functionalOptions = importFunctionalOptionsFromEnterprise(context, undefined, data.ФункциональныеОпции)
  // if (functionalOptions) column.functionalOptions = functionalOptions

  return result
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
  const importedTitle = importI8nTextFromEnterprise(context, { type: "I8nText" }, titleEnterprise)

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

registerTypeRule("FormAttributes", "importFromEnterprise", importFormAttributesFromEnterprise)
registerTypeRule("FormAttributeColumns", "importFromEnterprise", importFormAttributeColumnsFromEnterprise)
