import "~/metadata/forms"
import type { ClientApplicationForm } from "~/metadata/forms/clientApplicationForm/types"
import type { ChildItem } from "~/metadata/forms/commonObjects/childItems/types"
import type { ElementRule, ElementType } from "~/metadata/orchestration"
import { getElementRule } from "~/metadata/orchestration/formElement/ruleFactory"
import type { DataPathPropertyRule, PropertyRule } from "~/metadata/orchestration/property/types"
import { ClientApplicationFormRules } from "~/metadata/forms/clientApplicationForm/rules"
import type { YamlPath } from "../yamlLocations"
import type { TableContext } from "./resolver"

export interface FormDataPathOccurrence {
  rule: DataPathPropertyRule
  value: string
  yamlPath: YamlPath
  elementType?: ElementType
  tableContext?: TableContext
}

export function collectFormDataPathOccurrences(form: ClientApplicationForm): FormDataPathOccurrence[] {
  return [
    ...collectDataPathProperties({
      owner: form,
      properties: ClientApplicationFormRules.properties,
      yamlPath: [],
    }),
    ...collectSingletonElementProperties({
      owner: form,
      properties: ClientApplicationFormRules.properties,
      yamlPath: [],
    }),
    ...collectChildItems({
      childItems: form.childItems,
      yamlPath: ["Элементы"],
    }),
  ]
}

function collectChildItems(params: {
  childItems: readonly ChildItem[] | undefined
  yamlPath: YamlPath
  tableContext?: TableContext
}): FormDataPathOccurrence[] {
  const occurrences: FormDataPathOccurrence[] = []
  for (const childItem of params.childItems ?? []) {
    occurrences.push(...collectElementOccurrences({
      element: childItem,
      yamlPath: [...params.yamlPath, childItem.name],
      tableContext: params.tableContext,
    }))
  }

  return occurrences
}

function collectElementOccurrences(params: {
  element: ChildItem | ElementRecord
  yamlPath: YamlPath
  tableContext?: TableContext
}): FormDataPathOccurrence[] {
  const rule = getElementRule(params.element.itemType)
  const itemOccurrences = collectDataPathProperties({
    owner: params.element,
    properties: rule.properties,
    yamlPath: params.yamlPath,
    elementType: params.element.itemType,
    tableContext: params.tableContext,
  })
  const childTableContext = tableContextForChildren({
    itemType: params.element.itemType,
    currentContext: params.tableContext,
    occurrences: itemOccurrences,
  })

  return [
    ...itemOccurrences,
    ...collectSingletonElementProperties({
      owner: params.element,
      properties: rule.properties,
      yamlPath: params.yamlPath,
      elementType: params.element.itemType,
      tableContext: params.tableContext,
    }),
    ...collectChildItems({
      childItems: childItemsOf(params.element),
      yamlPath: [...params.yamlPath, "Элементы"],
      tableContext: childTableContext,
    }),
  ]
}

function collectDataPathProperties(params: {
  owner: unknown
  properties: Record<string, PropertyRule>
  yamlPath: YamlPath
  elementType?: ElementType
  tableContext?: TableContext
}): FormDataPathOccurrence[] {
  const owner = asRecord(params.owner)
  if (owner === undefined) return []

  const occurrences: FormDataPathOccurrence[] = []
  for (const [propertyName, rule] of Object.entries(params.properties)) {
    if (!isDataPathRule(rule) || typeof rule.yaml !== "string") continue

    const value = owner[propertyName]
    if (typeof value !== "string" || value.trim().length === 0) continue

    occurrences.push({
      rule,
      value,
      yamlPath: [...params.yamlPath, rule.yaml],
      ...(params.elementType !== undefined ? { elementType: params.elementType } : {}),
      ...(params.tableContext !== undefined ? { tableContext: params.tableContext } : {}),
    })
  }

  return occurrences
}

function collectSingletonElementProperties(params: {
  owner: unknown
  properties: Record<string, PropertyRule>
  yamlPath: YamlPath
  elementType?: ElementType
  tableContext?: TableContext
}): FormDataPathOccurrence[] {
  const owner = asRecord(params.owner)
  if (owner === undefined) return []

  const occurrences: FormDataPathOccurrence[] = []
  for (const [propertyName, rule] of Object.entries(params.properties)) {
    if (isDataPathRule(rule) || typeof rule.yaml !== "string") continue

    const nestedElement = getElementRecord(owner[propertyName])
    if (nestedElement === undefined) continue

    occurrences.push(
      ...collectElementOccurrences({
        element: nestedElement,
        yamlPath: [...params.yamlPath, rule.yaml],
        ...(params.tableContext !== undefined ? { tableContext: params.tableContext } : {}),
      }),
    )
  }

  return occurrences
}

function tableContextForChildren(params: {
  itemType: ElementType
  currentContext?: TableContext
  occurrences: readonly FormDataPathOccurrence[]
}): TableContext | undefined {
  if (params.itemType !== "Table") return params.currentContext

  const tableDataPath = params.occurrences.find((occurrence) => occurrence.rule.yaml === "ПутьКДанным")?.value
  return tableDataPath === undefined ? params.currentContext : { dataPath: tableDataPath }
}

function childItemsOf(item: unknown): readonly ChildItem[] | undefined {
  const childItems = asRecord(item)?.childItems
  return Array.isArray(childItems) ? (childItems as ChildItem[]) : undefined
}

interface ElementRecord extends Record<string, unknown> {
  itemType: ElementType
}

function getElementRecord(value: unknown): ElementRecord | undefined {
  const record = asRecord(value)
  if (record === undefined || typeof record.itemType !== "string") return undefined

  return getElementRuleIfKnown(record.itemType) === undefined ? undefined : (record as ElementRecord)
}

function getElementRuleIfKnown(itemType: string): ElementRule | undefined {
  try {
    return getElementRule(itemType as ElementType)
  } catch {
    return undefined
  }
}

function isDataPathRule(rule: PropertyRule): rule is DataPathPropertyRule {
  return rule.type === "DataPath"
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : undefined
}
