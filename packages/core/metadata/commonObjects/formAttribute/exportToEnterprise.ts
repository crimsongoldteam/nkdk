import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { exportDynamicListToEnterprise } from "~/metadata/commonObjects/dynamicList/exportToEnterprise"
import {
  FormAttribute,
  FormAttributeColumn,
  FormAttributeColumnEnterprise,
  FormAttributeEnterprise,
  FormAttributes,
  FormAttributesEnterprise,
} from "~/metadata/commonObjects/formAttribute/types"
import { exportI8nTextToEnterprise } from "~/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportTypeDescriptionToEnterprise } from "~/metadata/commonObjects/typeDescription/exportToEnterprise"
import { TypeDescription, TypeDescriptionEnterprise } from "~/metadata/commonObjects/typeDescription/types"
import { exportUserVisibleToEnterprise } from "~/metadata/commonObjects/userVisible/exportToEnterprise"
import {
  UserEditKeysEnterprise,
  UserViewKeysEnterprise,
  UserVisibleKeysEnterprise,
} from "~/metadata/commonObjects/userVisible/types"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportSystemEnumerationToEnterprise } from "~/metadata/systemEnumerations/exportToEnterprise"
import { FillCheckingEnterprise, FillCheckingToEnterprise } from "~/metadata/systemEnumerations/types"
import { extractDifferentSynonymPart } from "../../helpers/synonymHelpers"
import { DynamicList } from "../dynamicList/types"
import { exportFunctionalOptionsToEnterprise } from "../functionalOptionsProperty/exportToEnterprise"
import { I8nTextEnterprise } from "../i8nText/types"
import { exportFieldsListToEnterprise } from "../FieldsList/exportToEnterprise"

export const exportFormAttributesToEnterprise = (
  context: ConfigurationContext,
  data: FormAttributes | undefined
): FormAttributesEnterprise | undefined => {
  if (!data) return undefined

  return Object.fromEntries(
    data.map((value: FormAttribute) => [value.name, exportFormAttributeToEnterprise(context, value)!])
  )
}

const exportFormAttributeToEnterprise = (
  context: ConfigurationContext,
  data: FormAttribute
): FormAttributeEnterprise | TypeDescriptionEnterprise => {
  const type = exportTypeDescriptionToEnterprise(context, data.valueType)

  const filteredTitle = data.title ? extractDifferentSynonymPart(context, data.title, data.name) : undefined
  const title = computeTitleForExport(context, data, filteredTitle)

  if (canUseShortFormat(data, title)) {
    return type!
  }

  const result: FormAttributeEnterprise = {}

  if (type !== undefined) result.Тип = type

  if (title !== undefined) result.Заголовок = title

  const mainAttribute = exportBooleanToEnterprise(context, data.mainAttribute)
  if (mainAttribute !== undefined) result.ОсновнойРеквизит = mainAttribute

  const storedData = exportBooleanToEnterprise(context, data.storedData)
  if (storedData !== undefined) result.СохраняемыеДанные = storedData

  const fillCheck = exportSystemEnumerationToEnterprise<FillCheckingEnterprise>(
    context,
    data.fillCheck,
    FillCheckingToEnterprise
  )
  if (fillCheck) result.ПроверкаЗаполнения = fillCheck

  const view = exportUserVisibleToEnterprise(context, data.view, {
    allow: UserVisibleKeysEnterprise.Allow,
    deny: UserVisibleKeysEnterprise.Deny,
  })
  if (view) Object.assign(result, view)

  if (JSON.stringify(data.view) !== JSON.stringify(data.edit)) {
    const edit = exportUserVisibleToEnterprise(context, data.edit, {
      allow: UserEditKeysEnterprise.Allow,
      deny: UserEditKeysEnterprise.Deny,
    })
    if (edit) Object.assign(result, edit)
  }

  if (data.settings !== undefined) {
    // Check if valueType is DynamicList or if settings has @attributes (indicating it's a DynamicList)
    const isDynamicListValueType = data.valueType?.type.includes("DynamicList")
    const isDynamicListSettings =
      "@attributes" in data.settings || (isDynamicListValueType && !("type" in data.settings))

    if (isDynamicListSettings) {
      const dynamicList = exportDynamicListToEnterprise(context, data.settings as DynamicList)
      if (dynamicList !== undefined) result.ДинамическийСписок = dynamicList
    } else if ("type" in data.settings) {
      const settings = exportTypeDescriptionToEnterprise(context, data.settings as TypeDescription)
      if (settings !== undefined) result.ТипЗначения = settings
    }
  }

  if (data.columns && data.columns.length > 0) {
    result.Колонки = exportFormAttributeColumnsToEnterprise(context, data.columns)
  }

  const functionalOptions = exportFunctionalOptionsToEnterprise(context, data.functionalOptions)
  if (functionalOptions) {
    result.ФункциональныеОпции = functionalOptions
  }

  const fieldsList = exportFieldsListToEnterprise(context, data.fieldsList)
  if (fieldsList) {
    result.ИспользоватьВсегда = fieldsList
  }

  const save = exportFieldsListToEnterprise(context, data.save)
  if (save) {
    result.Сохранение = save
  }

  return result as FormAttributeEnterprise
}

const exportFormAttributeColumnsToEnterprise = (
  context: ConfigurationContext,
  columns: FormAttributeColumn[]
): Record<string, FormAttributeColumnEnterprise> => {
  return Object.fromEntries(
    columns.map((column) => [column.name, exportFormAttributeColumnToEnterprise(context, column)])
  )
}

const exportFormAttributeColumnToEnterprise = (
  context: ConfigurationContext,
  column: FormAttributeColumn
): FormAttributeColumnEnterprise => {
  const result: FormAttributeColumnEnterprise = {}

  const title = exportI8nTextToEnterprise(context, column.title)
  if (title) result.Заголовок = title

  const type = exportTypeDescriptionToEnterprise(context, column.type)
  if (type) result.Тип = type

  const fillCheck = exportSystemEnumerationToEnterprise<FillCheckingEnterprise>(
    context,
    column.fillCheck,
    FillCheckingToEnterprise
  )
  if (fillCheck) result.ПроверкаЗаполнения = fillCheck

  const view = exportUserVisibleToEnterprise(context, column.view, {
    allow: UserViewKeysEnterprise.Allow,
    deny: UserViewKeysEnterprise.Deny,
  })
  if (view) Object.assign(result, view)

  const edit = exportUserVisibleToEnterprise(context, column.edit, {
    allow: UserEditKeysEnterprise.Allow,
    deny: UserEditKeysEnterprise.Deny,
  })
  if (edit) Object.assign(result, edit)

  if (column.columns && column.columns.length > 0) {
    result.Колонки = exportFormAttributeColumnsToEnterprise(context, column.columns)
  }

  const functionalOptions = exportFunctionalOptionsToEnterprise(context, column.functionalOptions)
  if (functionalOptions) {
    result.ФункциональныеОпции = functionalOptions
  }

  return result
}

/**
 * Вычисляет заголовок для экспорта в enterprise с учетом mainAttribute.
 * Если mainAttribute = true:
 * - Если заголовок пустой ("") - не выводить Заголовок
 * - Если заголовок равен имени (filteredTitle === undefined, но data.title существует и не пустой) - вывести заголовок
 * Иначе - обычная логика
 */
const computeTitleForExport = (
  context: ConfigurationContext,
  data: FormAttribute,
  filteredTitle: ReturnType<typeof extractDifferentSynonymPart>
): I8nTextEnterprise | undefined => {
  const defaultLanguage = context.defaultLanguage
  const defaultTitle = data.title?.items[defaultLanguage]

  // Если mainAttribute = true
  if (data.mainAttribute === true) {
    // Если заголовок пустой - не выводить
    if (defaultTitle === "") {
      return undefined
    }
    // Если заголовок равен имени (filteredTitle === undefined, но data.title существует и не пустой)
    if (filteredTitle === undefined && data.title && defaultTitle !== undefined) {
      return exportI8nTextToEnterprise(context, data.title)
    }
  }

  // Обычная логика
  return exportI8nTextToEnterprise(context, filteredTitle)
}

const canUseShortFormat = (data: FormAttribute, title: I8nTextEnterprise | undefined): boolean => {
  if (title !== undefined) return false
  if (data.settings !== undefined) return false
  if (data.columns !== undefined && data.columns.length > 0) return false
  if (data.functionalOptions !== undefined && data.functionalOptions.length > 0) return false
  const filteredData = Object.fromEntries(
    Object.entries(data).filter(
      ([key, value]) =>
        value !== undefined &&
        !["name", "id", "valueType", "title", "settings", "columns", "functionalOptions"].includes(key)
    )
  )
  return Object.keys(filteredData).length === 0
}
