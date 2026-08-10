import type { FormDataPathTabularElementDeclaration } from "../../ruleRuntime/dataPath/formIndex"
import { acceptFormTabularElementVisit } from "../../ruleRuntime/formElement/formTableDataPaths"
import { getFormElementCollectionTypes } from "../../ruleRuntime/formElement/registry"
import { collectFormDataPathOccurrencesFromYAML } from "../../validation/dataPath/formYamlTraversal"
import { TableRules } from "../elements/table/rules"
import { ClientApplicationFormRules } from "./rules"

const collectFormTabularElementsFromYAML = (
  yaml: unknown
): ReadonlyMap<string, FormDataPathTabularElementDeclaration> => {
  const result = new Map<string, FormDataPathTabularElementDeclaration>()
  collectFormDataPathOccurrencesFromYAML({
    yaml,
    rule: ClientApplicationFormRules,
    visitElement: (visit) => acceptFormTabularElementVisit(result, visit),
    resolveCollectionItemRule: resolveClientApplicationFormCollectionItemRule,
  })
  return result
}

export const resolveClientApplicationFormCollectionItemRule = (params: {
  yaml: unknown
  propertyRule: { type: string }
}) =>
  asRecord(params.yaml)?.["Вид"] === "ДеревоФормы" &&
  getFormElementCollectionTypes(params.propertyRule.type)?.includes("Table")
    ? TableRules
    : undefined

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined

export const clientApplicationFormDataPathProjection = {
  attributeItemType: "FormAttribute",
  columnItemType: "FormAttributeColumn",
  tabularElementItemTypes: ["Table"],
  attributesYaml: "Реквизиты",
  columnsYaml: "Колонки",
  typeYaml: "Тип",
  dynamicListYaml: "ДинамическийСписок",
  additionalColumnsYaml: "ДополнительныеКолонки",
  typePropertyKey: "type",
  dynamicListPropertyKey: "dynamicList",
  additionalColumnsPropertyKey: "additionalColumns",
  tableDataPathPropertyKey: "dataPath",
  collectTabularElementsFromYAML: collectFormTabularElementsFromYAML,
  dataPathDialect: {
    serviceRoot: { internal: "Items", yaml: "Элементы" },
    currentRow: { internal: "CurrentData", yaml: "ТекущиеДанные" },
  },
} as const
