import { TypeDescriptionYAML } from "~/metadata/commonObjects/typeDescription/types"
import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { exportPropertiesToYAML, registerTypeRule } from "~/metadata/orchestration"
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
  _rule: PropertyRule | undefined,
  data: FormAttributes | undefined
): FormAttributesYAML | undefined => {
  if (!data) return undefined

  return Object.fromEntries(
    data.map((value: FormAttribute) => [value.name, exportFormAttributeToYAML(context, undefined, value)!])
  )
}

const exportFormAttributeToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: FormAttribute
): FormAttributeYAML | TypeDescriptionYAML => {
  const contextWithParent =
    data.name !== undefined && context.exportToYAML !== undefined
      ? {
          ...context,
          exportToYAML: {
            ...context.exportToYAML,
            parent: { name: data.name },
          },
        }
      : context

  const result = exportPropertiesToYAML({
    context: contextWithParent,
    data: data,
    rule: FormAttributeRules,
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

const exportFormAttributeColumnsToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  columns: FormAttributeColumns
): FormAttributeColumnsYAML | undefined => {
  if (columns.length === 0) return undefined

  return exportColumnsToYAML(context, undefined, columns)
}

const exportColumnsToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  columns: FormAttributeColumn[]
): FormAttributeColumnsYAML => {
  return Object.fromEntries(
    columns.map((column) => [column.name, exportFormAttributeColumnToYAMLInternal(context, undefined, column)])
  )
}

const exportFormAttributeColumnToYAMLInternal = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  column: FormAttributeColumn
): FormAttributeColumnYAML => {
  const result = exportPropertiesToYAML({
    context,
    data: column,
    rule: FormAttributeColumnRules,
  })!

  return result
}

export const exportFormAttributeColumnToYAML = (
  context: ConfigurationContext,
  data: FormAttributeColumn | undefined
): FormAttributeColumnYAML | undefined => {
  if (!data) return undefined

  return exportFormAttributeColumnToYAMLInternal(context, undefined, data)
}

const exportAdditionalColumnsToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  additionalColumns: FormAttributeAdditionalColumns[] | undefined
): FormAttributeAdditionalColumnYAML | undefined => {
  if (additionalColumns === undefined || additionalColumns.length === 0) return undefined

  return Object.fromEntries(
    additionalColumns.map((additionalColumn) => [
      additionalColumn.table,
      exportColumnsToYAML(context, undefined, additionalColumn.columns),
    ])
  )
}

registerTypeRule("FormAttributes", "exportToYAML", exportFormAttributesToYAML)
registerTypeRule("FormAttributeColumns", "exportToYAML", exportFormAttributeColumnsToYAML)
registerTypeRule("FormAttributeAdditionalColumns", "exportToYAML", exportAdditionalColumnsToYAML)
