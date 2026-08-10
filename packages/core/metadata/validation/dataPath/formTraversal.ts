import type { ElementRule, ElementType } from "../../ruleRuntime/formElement/types"
import { getElementRule } from "../../ruleRuntime/formElement/ruleFactory"
import type { DataPathPropertyRule, PropertyRule } from "../../ruleRuntime/property/types"
import type { FormValidationView } from "../formContracts"
import { requireFormValidationAdapter } from "../formValidationRegistry"
import type { YamlPath } from "../yamlLocations"
import type { DataPathNameMode } from "./coreResolver"
import type { TableContext } from "./resolver"

export interface FormDataPathOccurrence {
  rule: DataPathPropertyRule
  value: string
  setValue(nextValue: string): void
  yamlPath: YamlPath
  elementType?: ElementType
  hasValuesPicture?: boolean
  hasMultipleValuesExtendedEdit?: boolean
  tableContext?: TableContext
  tagged?: boolean
  nameMode?: DataPathNameMode
}

export function collectFormDataPathOccurrences(form: FormValidationView): FormDataPathOccurrence[] {
  const formRule = requireFormValidationAdapter().formRule
  return [
    ...collectDataPathProperties({
      owner: form,
      properties: formRule.properties,
      yamlPath: [],
    }),
    ...collectSingletonElementProperties({
      owner: form,
      properties: formRule.properties,
      yamlPath: [],
    }),
    ...collectChildItems({
      childItems: childItemsOf(form),
      yamlPath: ["Элементы"],
    }),
  ]
}

function collectChildItems(params: {
  childItems: readonly NamedElementRecord[] | undefined
  yamlPath: YamlPath
  tableContext?: TableContext
}): FormDataPathOccurrence[] {
  const occurrences: FormDataPathOccurrence[] = []
  for (const childItem of params.childItems ?? []) {
    occurrences.push(
      ...collectElementOccurrences({
        element: childItem,
        yamlPath: [...params.yamlPath, childItem.name],
        tableContext: params.tableContext,
      })
    )
  }

  return occurrences
}

function collectElementOccurrences(params: {
  element: ElementRecord
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
      setValue: (nextValue) => {
        owner[propertyName] = nextValue
      },
      yamlPath: [...params.yamlPath, rule.yaml],
      nameMode: "internal",
      ...(params.elementType !== undefined ? { elementType: params.elementType } : {}),
      ...(owner["valuesPicture"] !== undefined ? { hasValuesPicture: true } : {}),
      ...(owner["multipleValuesExtendedEdit"] === true ? { hasMultipleValuesExtendedEdit: true } : {}),
      ...tableContextForDataPathRule(rule, params.tableContext),
    })
  }

  return occurrences
}

function tableContextForDataPathRule(
  rule: DataPathPropertyRule,
  tableContext: TableContext | undefined
): { tableContext: TableContext } | {} {
  return tableContext !== undefined && rule.yaml === "ПутьКДанным" ? { tableContext } : {}
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
      })
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

function childItemsOf(item: unknown): readonly NamedElementRecord[] | undefined {
  const childItems = asRecord(item)?.childItems
  return Array.isArray(childItems) ? childItems.filter(isNamedElementRecord) : undefined
}

interface ElementRecord extends Record<string, unknown> {
  itemType: ElementType
}

interface NamedElementRecord extends ElementRecord {
  name: string
}

function getElementRecord(value: unknown): ElementRecord | undefined {
  const record = asRecord(value)
  if (record === undefined || typeof record.itemType !== "string") return undefined

  return getElementRuleIfKnown(record.itemType) === undefined ? undefined : (record as ElementRecord)
}

function isNamedElementRecord(value: unknown): value is NamedElementRecord {
  const element = getElementRecord(value)
  return element !== undefined && typeof element.name === "string"
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
