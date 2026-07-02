import { ConfigurationContext } from "../../../context/types"
import { PropertyRule } from "../../elements/calendarField/rules"
import { importMetadataItemFromYAML, registerTypeRule } from "../../../orchestration"
import "../dynamicList/types"
import { FormAttributeColumnRules, FormAttributeRules } from "./rules"
import {
  FormAttribute,
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
  data: FormAttributesYAML | undefined,
  source?: FormAttributes
): FormAttributes | undefined => {
  if (!data) return undefined

  const results = Object.entries(data).map(([name, value]) =>
    importFormAttributeFromYAML(
      context,
      value,
      name,
      source?.find((attribute) => attribute.name === name)
    )
  )

  return results.length > 0 ? results : undefined
}

export const importFormAttributeColumnFromYAML = (
  context: ConfigurationContext,
  yaml: FormAttributeColumnYAML | undefined,
  name: string,
  source?: FormAttributeColumn
): FormAttributeColumn | undefined => {
  if (!yaml) return undefined

  return importColumnFromYAML(context, undefined, yaml, name, source)
}

const importFormAttributeFromYAML = (
  context: ConfigurationContext,
  yaml: FormAttributeYAML,
  name: string,
  source?: FormAttribute
): FormAttribute => {
  const properties = importMetadataItemFromYAML({
    context: context,
    yaml,
    rule: FormAttributeRules,
    name,
    source,
  })

  const attribute = {
    ...properties,
    name,
  }

  const columns = importFormAttributeColumnsFromYAML(context, yaml, source?.columns)
  const additionalColumns = importFormAttributeAdditionalColumnsFromYAML(context, yaml, source?.additionalColumns)

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
  yamlWithColumns: FormAttributeYAML,
  source?: FormAttributeColumns
): FormAttributeColumns => {
  const columnsData = yamlWithColumns.Колонки
  if (columnsData == null) return []

  return importColumnsFromYAML(context, columnsData, source)
}

const importColumnsFromYAML = (
  context: ConfigurationContext,
  data: FormAttributeColumnsYAML | undefined,
  source?: FormAttributeColumns
): FormAttributeColumns => {
  if (!data) return []

  return Object.entries(data).map(([name, value]) =>
    importColumnFromYAML(
      context,
      undefined,
      value,
      name,
      source?.find((column) => column.name === name)
    )
  )
}

const importColumnFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: FormAttributeColumnYAML,
  name: string,
  source?: FormAttributeColumn
): FormAttributeColumn => {
  const properties = importMetadataItemFromYAML({
    context: context,
    yaml: data,
    rule: FormAttributeColumnRules,
    name,
    source,
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
  data: Record<string, Record<string, FormAttributeColumnYAML>>,
  source?: FormAttributeAdditionalColumns[]
): FormAttributeAdditionalColumns[] => {
  return Object.entries(data).map(([tableName, columns]) => ({
    table: tableName,
    columns: importColumnsFromYAML(
      context,
      columns,
      source?.find((additionalColumn) => additionalColumn.table === tableName)?.columns
    ) as FormAttributeColumn[],
  }))
}

const importFormAttributeAdditionalColumnsFromYAML = (
  context: ConfigurationContext,
  yamlWithColumns: FormAttributeYAML,
  source?: FormAttributeAdditionalColumns[]
): FormAttributeAdditionalColumns[] => {
  if (yamlWithColumns.ДополнительныеКолонки != null) {
    return importAdditionalColumnsFromYAML(context, yamlWithColumns.ДополнительныеКолонки, source)
  }

  return []
}

registerTypeRule("FormAttributes", "importFromYAML", importFormAttributesFromYAML)
