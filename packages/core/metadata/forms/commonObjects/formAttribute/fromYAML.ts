import { TypeDescriptionEnterprise } from "~/metadata/commonObjects/typeDescription/types"
import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { importPropertiesFromYAML } from "~/metadata/metadataFactory"
import { FormAttributeColumnRules, FormAttributeRules } from "./rules"
import {
  FormAttribute,
  FormAttributeAdditionalColumn,
  FormAttributeAdditionalColumnYAML,
  FormAttributeColumn,
  FormAttributeColumnYAML,
  FormAttributeColumns,
  FormAttributeColumnsYAML,
  FormAttributeYAML,
  FormAttributes,
  FormAttributesEnterprise,
} from "./types"

export const importFormAttributesFromEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  data: FormAttributesEnterprise | undefined
): FormAttributes | undefined => {
  if (!data) return undefined

  const results = Object.entries(data).map(([name, value]) => importFormAttributeFromEnterprise(context, value, name))

  return results.length > 0 ? results : undefined
}

const importFormAttributeFromEnterprise = (
  context: ConfigurationContext,
  yaml: FormAttributeYAML | TypeDescriptionEnterprise,
  name: string
): FormAttribute => {
  const properties = importPropertiesFromYAML({
    context: context,
    yaml: yaml as FormAttributeYAML,
    metadataType: "FormAttribute",
    rules: FormAttributeRules,
    name,
  })

  const columns = importFormAttributeColumnsFromEnterpriseYAML(context, yaml, properties)

  const result: FormAttribute = {
    ...properties,
    columns,
    name,
  }

  return result
}

const importFormAttributeColumnsFromEnterpriseYAML = (
  context: ConfigurationContext,
  yamlWithColumns: FormAttributeYAML | TypeDescriptionEnterprise,
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

  const formObjectTypes = ["ValueTable", "ValueTree", "ChoiceList"]
  const isFormObject = formAttribute.type?.type.some((t) => formObjectTypes.includes(t))

  const columns = isFormObject
    ? importFormAttributeColumnsFromEnterprise(context, columnsData)
    : importFormAttributeAdditionalColumnsFromEnterprise(context, columnsData as FormAttributeAdditionalColumnYAML)

  return columns ?? []
}

const importFormAttributeColumnsFromEnterprise = (
  context: ConfigurationContext,
  data: FormAttributeColumnsYAML | undefined
): FormAttributeColumns => {
  if (!data) return []

  return Object.entries(data).map(([name, value]) =>
    importFormAttributeColumnFromEnterprise(context, undefined, value, name)
  )
}

const importFormAttributeColumnFromEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  data: FormAttributeColumnYAML,
  name: string
): FormAttributeColumn => {
  const properties = importPropertiesFromYAML({
    context: context,
    yaml: data,
    metadataType: "FormAttributeColumn",
    rules: FormAttributeColumnRules,
    name,
  })

  const result: FormAttributeColumn = {
    ...properties,
    name,
  }

  return result
}

const importFormAttributeAdditionalColumnsFromEnterprise = (
  context: ConfigurationContext,
  data: Record<string, Record<string, FormAttributeColumnYAML>>
): FormAttributeAdditionalColumn[] => {
  return Object.entries(data).map(([tableName, columns]) => ({
    table: tableName,
    columns: importFormAttributeColumnsFromEnterprise(context, columns) as FormAttributeColumn[],
  }))
}
