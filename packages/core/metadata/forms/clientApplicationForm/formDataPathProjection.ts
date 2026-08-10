import type { FormDataPathTabularElementDeclaration } from "@nkdk/runtime/rule-kit"
import { acceptFormTabularElementVisit } from "../../ruleRuntime/formElement/formTableDataPaths"
import { getFormElementCollectionTypes } from "../../ruleRuntime/formElement/registry"
import { collectFormDataPathOccurrencesFromYAML } from "../../validation/dataPath/formYamlTraversal"
import { TableRules } from "../elements/table/rules"
import { ClientApplicationFormRules } from "./rules"
import { findMainAttributeName } from "./mainAttributeKinds"

const collectFormTabularElementsFromYAML = (
  yaml: unknown,
  options?: { readonly inferImplicitDataPaths?: boolean }
): ReadonlyMap<string, FormDataPathTabularElementDeclaration> => {
  const result = new Map<string, FormDataPathTabularElementDeclaration>()
  collectFormDataPathOccurrencesFromYAML({
    yaml,
    rule: ClientApplicationFormRules,
    visitElement: (visit) => acceptFormTabularElementVisit(result, visit),
    resolveCollectionItemRule: resolveClientApplicationFormCollectionItemRule,
  })
  if (options?.inferImplicitDataPaths === true) {
    const mainAttribute = findMainAttributeName(asRecord(yaml)?.["Реквизиты"])
    if (mainAttribute !== undefined) {
      for (const [name, declaration] of result) {
        if (declaration.dataPath === undefined) {
          result.set(name, { kind: "tabularFormElement", dataPath: `${mainAttribute}.${name}` })
        }
      }
    }
  }
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
