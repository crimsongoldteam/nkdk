import { TypeDescriptionEnterprise } from "~/metadata/commonObjects/typeDescription/types"
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
  FormAttributesEnterprise,
} from "./types"

export const exportFormAttributesToEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  data: FormAttributes | undefined
): FormAttributesEnterprise | undefined => {
  if (!data) return undefined

  return Object.fromEntries(
    data.map((value: FormAttribute) => [value.name, exportFormAttributeToEnterprise(context, undefined, value)!])
  )
}

const exportFormAttributeToEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  data: FormAttribute
): FormAttributeYAML | TypeDescriptionEnterprise => {
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
  //     const dynamicList = exportDynamicListToEnterprise(context, undefined, data.settings as DynamicList)
  //     if (dynamicList !== undefined) result.ДинамическийСписок = dynamicList
  //   } else if ("type" in data.settings) {
  //     const settings = exportTypeDescriptionToEnterprise(context, undefined, data.settings as TypeDescription)
  //     if (settings !== undefined) result.ТипЗначения = settings
  //   }
  // }
}

const isAdditionalColumns = (columns: FormAttributeColumns): columns is FormAttributeAdditionalColumns[] => {
  return columns.length > 0 && "table" in columns[0]
}

const exportFormAttributeColumnsToEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  columns: FormAttributeColumns
): FormAttributeColumnsYAML | undefined => {
  if (columns.length === 0) return undefined

  if (isAdditionalColumns(columns)) {
    return exportAdditionalColumnsToEnterprise(context, undefined, columns)
  }

  return exportColumnsToEnterprise(context, undefined, columns)
}

const exportColumnsToEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  columns: FormAttributeColumn[]
): FormAttributeColumnsYAML => {
  return Object.fromEntries(
    columns.map((column) => [column.name, exportFormAttributeColumnToEnterprise(context, undefined, column)])
  )
}

const exportFormAttributeColumnToEnterprise = (
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

const exportAdditionalColumnsToEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  additionalColumns: FormAttributeAdditionalColumns[]
): FormAttributeAdditionalColumnYAML => {
  return Object.fromEntries(
    additionalColumns.map((additionalColumn) => [
      additionalColumn.table.split(".").pop()!,
      exportColumnsToEnterprise(context, undefined, additionalColumn.columns),
    ])
  )
}

registerTypeRule("FormAttributes", "exportToEnterprise", exportFormAttributesToEnterprise)
registerTypeRule("FormAttributeColumns", "exportToEnterprise", exportFormAttributeColumnsToEnterprise)
