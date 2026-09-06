import type { ElementType } from "../../ruleRuntime/formElement/types"
import { getTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import type { DataPathPropertyRule, MetadataItemRule, PropertyRule } from "@nkdk/runtime/rule-kit"
import type { TableContext } from "./resolver"
import type { FormDataPathOccurrence } from "./formTraversal"
import type { YamlPath } from "../yamlLocations"

export interface FormYAMLItemVisit {
  yaml: Record<string, unknown>
  rule: MetadataItemRule
  yamlPath: YamlPath
}

export type FormYAMLItemVisitor = (visit: FormYAMLItemVisit) => void

export interface FormYAMLElementVisit extends FormYAMLItemVisit {
  name: string
  itemType: string
  primaryDataPath:
    | {
        yamlKey: string
        present: boolean
        value: unknown
      }
    | undefined
  tableOwner?: { name: string; yamlPath: YamlPath }
}

export type FormYAMLElementVisitor = (visit: FormYAMLElementVisit) => void

export type FormYAMLCollectionItemRuleResolver = (params: {
  yaml: unknown
  name: string | undefined
  propertyRule: PropertyRule
}) => MetadataItemRule | undefined

export function describeFormDataPath(params: {
  rule: DataPathPropertyRule
  value: unknown
  yamlPath: YamlPath
  itemType: string
  hasValuesPicture?: boolean
  hasMultipleValuesExtendedEdit?: boolean
  tableContext?: TableContext
}): Omit<FormDataPathOccurrence, "setValue"> | undefined {
  if (typeof params.value !== "string" || params.value.trim().length === 0) return undefined
  return {
    rule: params.rule,
    value: params.value,
    yamlPath: params.yamlPath,
    nameMode: "yaml",
    ...(isElementType(params.itemType) ? { elementType: params.itemType } : {}),
    ...(params.hasValuesPicture === true ? { hasValuesPicture: true } : {}),
    ...(params.hasMultipleValuesExtendedEdit === true ? { hasMultipleValuesExtendedEdit: true } : {}),
    ...(params.tableContext !== undefined && params.rule.yaml === "ПутьКДанным" ? { tableContext: params.tableContext } : {}),
  }
}

export function collectFormDataPathOccurrencesFromYAML(params: {
  yaml: unknown
  rule: MetadataItemRule
  visitItem?: FormYAMLItemVisitor
  visitElement?: FormYAMLElementVisitor
  resolveCollectionItemRule?: FormYAMLCollectionItemRuleResolver
}): FormDataPathOccurrence[] {
  return collectItem({
    yaml: params.yaml,
    rule: params.rule,
    yamlPath: [],
    visitItem: params.visitItem,
    visitElement: params.visitElement,
    resolveCollectionItemRule: params.resolveCollectionItemRule,
  })
}

function collectItem(params: {
  yaml: unknown
  rule: MetadataItemRule
  yamlPath: Array<string | number>
  elementName?: string
  tableContext?: TableContext
  tableOwner?: { name: string; yamlPath: YamlPath }
  visitItem?: FormYAMLItemVisitor
  visitElement?: FormYAMLElementVisitor
  resolveCollectionItemRule?: FormYAMLCollectionItemRuleResolver
}): FormDataPathOccurrence[] {
  const record = asRecord(params.yaml)
  if (record === undefined) return []
  params.visitItem?.({ yaml: record, rule: params.rule, yamlPath: params.yamlPath })
  if (params.elementName !== undefined) {
    params.visitElement?.({
      yaml: record,
      rule: params.rule,
      yamlPath: params.yamlPath,
      name: params.elementName,
      itemType: params.rule.itemType,
      primaryDataPath: readPrimaryDataPath(record, params.rule),
      ...(params.tableOwner === undefined ? {} : { tableOwner: params.tableOwner }),
    })
  }
  const occurrences: FormDataPathOccurrence[] = []

  for (const propertyRule of Object.values(params.rule.properties)) {
    if (typeof propertyRule.yaml !== "string") continue
    const rawValue = record[propertyRule.yaml]
    if (isDataPathRule(propertyRule)) {
      const occurrence = describeFormDataPath({
        rule: propertyRule, value: rawValue, yamlPath: [...params.yamlPath, propertyRule.yaml],
        itemType: params.rule.itemType,
        hasValuesPicture: hasYamlProperty(record, params.rule, "valuesPicture"),
        hasMultipleValuesExtendedEdit: isYamlTrue(readYamlProperty(record, params.rule, "multipleValuesExtendedEdit")),
        tableContext: params.tableContext,
      })
      if (occurrence === undefined) continue
      occurrences.push({
        ...occurrence,
        setValue: (nextValue) => {
          record[propertyRule.yaml as string] = nextValue
        },
      })
    }
  }

  const childTableContext =
    params.rule.itemType === "Table"
      ? (() => {
          const dataPath = occurrences.find((occurrence) => occurrence.rule.yaml === "ПутьКДанным")?.value
          return dataPath === undefined ? params.tableContext : { dataPath }
        })()
      : params.tableContext
  const childTableOwner =
    params.rule.itemType === "Table" && params.elementName !== undefined
      ? { name: params.elementName, yamlPath: params.yamlPath }
      : params.tableOwner

  for (const propertyRule of Object.values(params.rule.properties)) {
    if (typeof propertyRule.yaml !== "string" || isDataPathRule(propertyRule)) continue
    const value = record[propertyRule.yaml]
    const nested = collectNested({
      yaml: value,
      propertyRule,
      yamlPath: [...params.yamlPath, propertyRule.yaml],
      tableContext: childTableContext,
      tableOwner: childTableOwner,
      visitItem: params.visitItem,
      visitElement: params.visitElement,
      resolveCollectionItemRule: params.resolveCollectionItemRule,
    })
    occurrences.push(...nested)
  }

  return occurrences
}

function isYamlTrue(value: unknown): boolean {
  return value === true || value === "Истина"
}

function collectNested(params: {
  yaml: unknown
  propertyRule: PropertyRule
  yamlPath: Array<string | number>
  tableContext?: TableContext
  tableOwner?: { name: string; yamlPath: YamlPath }
  visitItem?: FormYAMLItemVisitor
  visitElement?: FormYAMLElementVisitor
  resolveCollectionItemRule?: FormYAMLCollectionItemRuleResolver
}): FormDataPathOccurrence[] {
  const descriptor = getTypeRule(params.propertyRule.type, "yamlToXMLNestedRule")
  if (descriptor === undefined || descriptor.kind === "externalFile") return []
  if (descriptor.kind === "item") {
    return collectItem({ ...params, rule: descriptor.itemRule })
  }
  if (descriptor.kind === "polymorphicRecord") {
    const record = asRecord(params.yaml)
    return record === undefined
      ? []
      : collectItem({ ...params, rule: descriptor.resolveItemRule({ yaml: record, name: "" }) })
  }

  const entries =
    descriptor.yamlShape === "record" ? Object.entries(asRecord(params.yaml) ?? {}) : arrayEntries(params.yaml)
  return entries.flatMap(([name, yaml], index) => {
    // Pure raw nodes have no semantic object and therefore declare no data paths.
    // Shape validation is performed independently of this facts projection.
    if (asRecord(yaml) === undefined) return []
    const stringName = typeof name === "string" ? name : undefined
    const itemRule =
      params.resolveCollectionItemRule?.({ yaml, name: stringName, propertyRule: params.propertyRule }) ??
      descriptor.resolveItemRule?.({
        yaml,
        name: stringName,
        index,
        propertyRule: params.propertyRule,
      }) ?? descriptor.itemRule
    return collectItem({
      yaml,
      rule: itemRule,
      yamlPath: [...params.yamlPath, name],
      elementName: stringName,
      tableContext: params.tableContext,
      tableOwner: params.tableOwner,
      visitItem: params.visitItem,
      visitElement: params.visitElement,
      resolveCollectionItemRule: params.resolveCollectionItemRule,
    })
  })
}

function readPrimaryDataPath(
  record: Record<string, unknown>,
  rule: MetadataItemRule
): FormYAMLElementVisit["primaryDataPath"] {
  const dataPathRule = primaryFormDataPathRule(rule)
  if (dataPathRule === undefined || typeof dataPathRule.yaml !== "string") return undefined
  return {
    yamlKey: dataPathRule.yaml,
    present: Object.prototype.hasOwnProperty.call(record, dataPathRule.yaml),
    value: record[dataPathRule.yaml],
  }
}

export function primaryFormDataPathRule(rule: MetadataItemRule): DataPathPropertyRule | undefined {
  return Object.values(rule.properties).find(
    (propertyRule): propertyRule is DataPathPropertyRule => isDataPathRule(propertyRule) && propertyRule.yaml === "ПутьКДанным",
  )
}

function arrayEntries(value: unknown): Array<[number, unknown]> {
  return Array.isArray(value) ? value.map((item, index) => [index, item]) : []
}

function readYamlProperty(record: Record<string, unknown>, rule: MetadataItemRule, propertyKey: string): unknown {
  const yamlKey = rule.properties[propertyKey]?.yaml
  return typeof yamlKey === "string" ? record[yamlKey] : undefined
}

function hasYamlProperty(record: Record<string, unknown>, rule: MetadataItemRule, propertyKey: string): boolean {
  const yamlKey = rule.properties[propertyKey]?.yaml
  return typeof yamlKey === "string" && Object.prototype.hasOwnProperty.call(record, yamlKey)
}

export function isDataPathRule(rule: PropertyRule): rule is DataPathPropertyRule {
  return rule.type === "DataPath"
}

function isElementType(value: string): value is ElementType {
  return value !== "ClientApplicationForm" && !value.startsWith("Metadata")
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined
}
