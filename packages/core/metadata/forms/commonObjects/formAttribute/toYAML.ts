import { TypeDescriptionYAML } from "~/metadata/commonObjects/typeDescription/types"
import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { exportPropertiesToYAML, registerTypeRule } from "~/metadata/metadataFactory"
import { FormAttributeColumnRules, FormAttributeRules } from "./rules"
import {
  FormAttribute,
  FormAttributeAdditionalColumnYAML,
  FormAttributeAdditionalColumns,
  FormAttributeColumn,
  FormAttributeColumnYAML,
  FormAttributeColumns,
  FormAttributeColumnsYAML,
  FormAttributeYAML,
  FormAttributes,
  FormAttributesYAML,
} from "./types"

export const exportFormAttributesToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  data: FormAttributes | undefined
): FormAttributesYAML | undefined => {
  if (!data) return undefined

  return Object.fromEntries(
    data.map((value: FormAttribute) => [value.name, exportFormAttributeToYAML(context, undefined, value)!])
  )
}

const exportFormAttributeToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  data: FormAttribute
): FormAttributeYAML | TypeDescriptionYAML => {
  const result = exportPropertiesToYAML({
    context,
    data: data,
    rules: FormAttributeRules,
  })!

  return result

  // if (data.settings !== undefined) {
  //   // Check if valueType is DynamicList or if settings has @attributes (indicating it's a DynamicList)
  //   const isDynamicListValueType = data.valueType?.type.includes("DynamicList")
  //   const isDynamicListSettings =
  //     "@attributes" in data.settings || (isDynamicListValueType && !("type" in data.settings))
  //   if (isDynamicListSettings) {
  //     const dynamicList = exportDynamicListToYAML(context, undefined, data.settings as DynamicList)
  //     if (dynamicList !== undefined) result.ДинамическийСписок = dynamicList
  //   } else if ("type" in data.settings) {
  //     const settings = exportTypeDescriptionToYAML(context, undefined, data.settings as TypeDescription)
  //     if (settings !== undefined) result.ТипЗначения = settings
  //   }
  // }
}

const isAdditionalColumns = (columns: FormAttributeColumns): columns is FormAttributeAdditionalColumns[] => {
  return columns.length > 0 && "table" in columns[0]
}

const exportFormAttributeColumnsToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  columns: FormAttributeColumns
): FormAttributeColumnsYAML | undefined => {
  if (columns.length === 0) return undefined

  if (isAdditionalColumns(columns)) {
    return exportAdditionalColumnsToYAML(context, undefined, columns)
  }

  return exportColumnsToYAML(context, undefined, columns)
}

const exportColumnsToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  columns: FormAttributeColumn[]
): FormAttributeColumnsYAML => {
  return Object.fromEntries(
    columns.map((column) => [column.name, exportFormAttributeColumnToYAML(context, undefined, column)])
  )
}

const exportFormAttributeColumnToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  column: FormAttributeColumn
): FormAttributeColumnYAML => {
  const result = exportPropertiesToYAML({
    context,
    data: column,
    rules: FormAttributeColumnRules,
  })!

  return result
}

const exportAdditionalColumnsToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  additionalColumns: FormAttributeAdditionalColumns[]
): FormAttributeAdditionalColumnYAML => {
  return Object.fromEntries(
    additionalColumns.map((additionalColumn) => [
      additionalColumn.table.split(".").pop()!,
      exportColumnsToYAML(context, undefined, additionalColumn.columns),
    ])
  )
}

registerTypeRule("FormAttributes", "exportToYAML", exportFormAttributesToYAML)
registerTypeRule("FormAttributeColumns", "exportToYAML", exportFormAttributeColumnsToYAML)
