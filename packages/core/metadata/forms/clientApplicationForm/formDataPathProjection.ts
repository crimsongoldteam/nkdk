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
    resolveCollectionItemRule: ({ yaml: itemYaml, propertyRule }) =>
      asRecord(itemYaml)?.["Вид"] === "ДеревоФормы" &&
      getFormElementCollectionTypes(propertyRule.type)?.includes("Table")
        ? TableRules
        : undefined,
  })
  return result
}

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
