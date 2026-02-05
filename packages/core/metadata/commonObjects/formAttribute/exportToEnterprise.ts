import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { exportDynamicListToEnterprise } from "~/metadata/commonObjects/dynamicList/exportToEnterprise"
import {
  FormAttribute,
  FormAttributeAdditionalColumn,
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
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { exportSystemEnumerationToEnterprise } from "~/metadata/systemEnumerations/exportToEnterprise"
import { FillCheckingEnterprise, FillCheckingToEnterprise } from "~/metadata/systemEnumerations/types"
import { extractDifferentSynonymPart } from "../../helpers/synonymHelpers"
import { DynamicList } from "../dynamicList/types"
import { exportFieldsListToEnterprise } from "../fieldsList/exportToEnterprise"
import { exportFunctionalOptionsToEnterprise } from "../functionalOptionsProperty/exportToEnterprise"
import { I8nTextEnterprise } from "../i8nText/types"

export const exportFormAttributesToEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: FormAttributes | undefined
): FormAttributesEnterprise | undefined => {
  if (!data) return undefined

  return Object.fromEntries(
    data.map((value: FormAttribute) => [value.name, exportFormAttributeToEnterprise(context, undefined, value)!])
  )
}

const exportFormAttributeToEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: FormAttribute
): FormAttributeEnterprise | TypeDescriptionEnterprise => {
  const type = exportTypeDescriptionToEnterprise(context, undefined, data.valueType)

  const filteredTitle = data.title ? extractDifferentSynonymPart(context, data.title, data.name) : undefined
  const title = computeTitleForExport(context, undefined, data, filteredTitle)

  if (canUseShortFormat(data, title)) {
    return type!
  }

  const result: FormAttributeEnterprise = {}

  if (type !== undefined) result.Тип = type

  if (title !== undefined) result.Заголовок = title

  const mainAttribute = exportBooleanToEnterprise(context, undefined, data.mainAttribute)
  if (mainAttribute !== undefined) result.ОсновнойРеквизит = mainAttribute

  const storedData = exportBooleanToEnterprise(context, undefined, data.storedData)
  if (storedData !== undefined) result.СохраняемыеДанные = storedData

  const fillCheck = exportSystemEnumerationToEnterprise<FillCheckingEnterprise>(
    context,
    undefined,
    data.fillCheck,
    FillCheckingToEnterprise
  )
  if (fillCheck) result.ПроверкаЗаполнения = fillCheck

  const view = exportUserVisibleToEnterprise(context, undefined, data.view, {
    allow: UserVisibleKeysEnterprise.Allow,
    deny: UserVisibleKeysEnterprise.Deny,
  })
  if (view) Object.assign(result, view)

  if (JSON.stringify(data.view) !== JSON.stringify(data.edit)) {
    const edit = exportUserVisibleToEnterprise(context, undefined, data.edit, {
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
      const dynamicList = exportDynamicListToEnterprise(context, undefined, data.settings as DynamicList)
      if (dynamicList !== undefined) result.ДинамическийСписок = dynamicList
    } else if ("type" in data.settings) {
      const settings = exportTypeDescriptionToEnterprise(context, undefined, data.settings as TypeDescription)
      if (settings !== undefined) result.ТипЗначения = settings
    }
  }

  if (data.columns && data.columns.length > 0) {
    result.Колонки = exportFormAttributeColumnsToEnterprise(context, undefined, data.columns)
  }

  if (data.additionalColumns && data.additionalColumns.length > 0) {
    result.ДополнительныеКолонки = exportFormAttributeAdditionalColumnsToEnterprise(
      context,
      undefined,
      data.additionalColumns
    )
  }

  const functionalOptions = exportFunctionalOptionsToEnterprise(context, undefined, data.functionalOptions)
  if (functionalOptions) {
    result.ФункциональныеОпции = functionalOptions
  }

  const fieldsList = exportFieldsListToEnterprise(context, undefined, data.fieldsList)
  if (fieldsList) {
    result.ИспользоватьВсегда = fieldsList
  }

  const save = exportFieldsListToEnterprise(context, undefined, data.save)
  if (save) {
    result.Сохранение = save
  }

  return result as FormAttributeEnterprise
}

const exportFormAttributeColumnsToEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  columns: FormAttributeColumn[]
): Record<string, FormAttributeColumnEnterprise> => {
  return Object.fromEntries(
    columns.map((column) => [column.name, exportFormAttributeColumnToEnterprise(context, undefined, column)])
  )
}

const exportFormAttributeColumnToEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  column: FormAttributeColumn
): FormAttributeColumnEnterprise => {
  const result: FormAttributeColumnEnterprise = {}

  const title = exportI8nTextToEnterprise(context, undefined, column.title)
  if (title) result.Заголовок = title

  const type = exportTypeDescriptionToEnterprise(context, undefined, column.type)
  if (type) result.Тип = type

  const fillCheck = exportSystemEnumerationToEnterprise<FillCheckingEnterprise>(
    context,
    undefined,
    column.fillCheck,
    FillCheckingToEnterprise
  )
  if (fillCheck) result.ПроверкаЗаполнения = fillCheck

  const view = exportUserVisibleToEnterprise(context, undefined, column.view, {
    allow: UserViewKeysEnterprise.Allow,
    deny: UserViewKeysEnterprise.Deny,
  })
  if (view) Object.assign(result, view)

  const edit = exportUserVisibleToEnterprise(context, undefined, column.edit, {
    allow: UserEditKeysEnterprise.Allow,
    deny: UserEditKeysEnterprise.Deny,
  })
  if (edit) Object.assign(result, edit)

  if (column.columns && column.columns.length > 0) {
    result.Колонки = exportFormAttributeColumnsToEnterprise(context, undefined, column.columns)
  }

  const functionalOptions = exportFunctionalOptionsToEnterprise(context, undefined, column.functionalOptions)
  if (functionalOptions) {
    result.ФункциональныеОпции = functionalOptions
  }

  return result
}

const exportFormAttributeAdditionalColumnsToEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  additionalColumns: FormAttributeAdditionalColumn[]
): Record<string, Record<string, FormAttributeColumnEnterprise>> => {
  return Object.fromEntries(
    additionalColumns.map((additionalColumn) => [
      additionalColumn.table.split(".").pop()!,
      exportFormAttributeColumnsToEnterprise(context, undefined, additionalColumn.columns),
    ])
  )
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
  _rule: PropertyRule | undefined,
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
      return exportI8nTextToEnterprise(context, undefined, data.title)
    }
  }

  // Обычная логика
  return exportI8nTextToEnterprise(context, undefined, filteredTitle)
}

const canUseShortFormat = (data: FormAttribute, title: I8nTextEnterprise | undefined): boolean => {
  if (title !== undefined) return false
  if (data.settings !== undefined) return false
  if (data.columns !== undefined && data.columns.length > 0) return false
  if (data.additionalColumns !== undefined && data.additionalColumns.length > 0) return false
  if (data.functionalOptions !== undefined && data.functionalOptions.length > 0) return false
  const filteredData = Object.fromEntries(
    Object.entries(data).filter(
      ([key, value]) =>
        value !== undefined &&
        !["name", "id", "valueType", "title", "settings", "columns", "additionalColumns", "functionalOptions"].includes(
          key
        )
    )
  )
  return Object.keys(filteredData).length === 0
}
