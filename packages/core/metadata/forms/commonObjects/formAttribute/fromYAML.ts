import { TypeDescriptionYAML } from "~/metadata/commonObjects/typeDescription/types"
import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { importMetadataItemFromYAML, registerTypeRule } from "~/metadata/orchestration"
import { FormAttributeColumnRules, FormAttributeRules } from "./rules"
import {
  FormAttribute,
  FormAttributeAdditionalColumnYAML,
  FormAttributeAdditionalColumns,
  FormAttributeColumn,
  FormAttributeColumnYAML,
  FormAttributeColumns,
  FormAttributeColumnsYAML,
  FormAttributeWithAdditionalColumns,
  FormAttributeYAML,
  FormAttributes,
  FormAttributesYAML,
} from "./types"

export const importFormAttributesFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: FormAttributesYAML | undefined
): FormAttributes | undefined => {
  if (!data) return undefined

  const results = Object.entries(data).map(([name, value]) => importFormAttributeFromYAML(context, value, name))

  return results.length > 0 ? results : undefined
}

export const importFormAttributeColumnFromYAML = (
  context: ConfigurationContext,
  yaml: FormAttributeColumnYAML | undefined,
  name: string
): FormAttributeColumn | undefined => {
  if (!yaml) return undefined

  return importColumnFromYAML(context, undefined, yaml, name)
}

const importFormAttributeFromYAML = (
  context: ConfigurationContext,
  yaml: FormAttributeYAML | TypeDescriptionYAML,
  name: string
): FormAttribute => {
  const properties = importMetadataItemFromYAML({
    context: context,
    yaml: yaml as FormAttributeYAML,
    rule: FormAttributeRules,
    name,
  })

  const attribute = {
    ...properties,
    name,
  }

  const columns = importFormAttributeColumnsFromYAML(context, yaml, attribute as FormAttribute)
  const additionalColumns = importFormAttributeAdditionalColumnsFromYAML(context, yaml, attribute as FormAttribute)

  if (columns == undefined) throw new Error("Columns are required")

  const result: FormAttributeWithAdditionalColumns = {
    ...attribute,
    columns,
    itemType: "FormAttribute",
  }

  if (additionalColumns.length > 0) {
    result.additionalColumns = additionalColumns
  }

  return result
}

const importFormAttributeColumnsFromYAML = (
  context: ConfigurationContext,
  yamlWithColumns: FormAttributeYAML | TypeDescriptionYAML,
  formAttribute: FormAttribute
): FormAttributeColumns => {
  if (
    typeof yamlWithColumns !== "object" ||
    yamlWithColumns === null ||
    Array.isArray(yamlWithColumns) ||
    !("Колонки" in yamlWithColumns)
  ) {
    return []
  }
  const columnsData = (yamlWithColumns as FormAttributeYAML).Колонки
  if (columnsData == null) {
    return []
  }

  if (!isFormObject(formAttribute)) {
    return []
  }

  return importColumnsFromYAML(context, columnsData)
}

const isFormObject = (formAttribute: FormAttribute): boolean => {
  const formObjectTypes = ["ValueTable", "ValueTree", "ChoiceList"]
  return formAttribute.type?.type.some((type) => formObjectTypes.includes(type)) ?? false
}

const importColumnsFromYAML = (
  context: ConfigurationContext,
  data: FormAttributeColumnsYAML | undefined
): FormAttributeColumns => {
  if (!data) return []

  return Object.entries(data).map(([name, value]) => importColumnFromYAML(context, undefined, value, name))
}

const importColumnFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: FormAttributeColumnYAML,
  name: string
): FormAttributeColumn => {
  const properties = importMetadataItemFromYAML({
    context: context,
    yaml: data,
    rule: FormAttributeColumnRules,
    name,
  })

  if (properties == undefined) throw new Error("Properties are required")

  const result: FormAttributeColumn = {
    ...properties,
    name,
  }

  return result
}

const importAdditionalColumnsFromYAML = (
  context: ConfigurationContext,
  data: Record<string, Record<string, FormAttributeColumnYAML>>
): FormAttributeAdditionalColumns[] => {
  return Object.entries(data).map(([tableName, columns]) => ({
    table: tableName,
    columns: importColumnsFromYAML(context, columns) as FormAttributeColumn[],
  }))
}

const importFormAttributeAdditionalColumnsFromYAML = (
  context: ConfigurationContext,
  yamlWithColumns: FormAttributeYAML | TypeDescriptionYAML,
  formAttribute: FormAttribute
): FormAttributeAdditionalColumns[] => {
  if (typeof yamlWithColumns !== "object" || yamlWithColumns === null || Array.isArray(yamlWithColumns)) {
    return []
  }

  const formAttributeYAML = yamlWithColumns as FormAttributeYAML
  if (formAttributeYAML.ДополнительныеКолонки != null) {
    return importAdditionalColumnsFromYAML(context, formAttributeYAML.ДополнительныеКолонки)
  }

  if (!isFormObject(formAttribute) && formAttributeYAML.Колонки != null) {
    return importAdditionalColumnsFromYAML(context, formAttributeYAML.Колонки as FormAttributeAdditionalColumnYAML)
  }

  return []
}

registerTypeRule("FormAttributes", "importFromYAML", importFormAttributesFromYAML)
