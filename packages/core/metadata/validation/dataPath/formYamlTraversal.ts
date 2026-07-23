import type { ElementType } from "../../orchestration/formElement/types"
import { getTypeRule } from "../../orchestration/property/typeRuleRegistry"
import type { DataPathPropertyRule, MetadataItemRule, PropertyRule } from "../../orchestration/property/types"
import type { TableContext } from "./resolver"
import type { FormDataPathOccurrence } from "./formTraversal"

export function collectFormDataPathOccurrencesFromYAML(params: {
  yaml: unknown
  rule: MetadataItemRule
}): FormDataPathOccurrence[] {
  return collectItem({ yaml: params.yaml, rule: params.rule, yamlPath: [] })
}

function collectItem(params: {
  yaml: unknown
  rule: MetadataItemRule
  yamlPath: Array<string | number>
  tableContext?: TableContext
}): FormDataPathOccurrence[] {
  const record = asRecord(params.yaml)
  if (record === undefined) return []
  const occurrences: FormDataPathOccurrence[] = []

  for (const propertyRule of Object.values(params.rule.properties)) {
    if (typeof propertyRule.yaml !== "string") continue
    const value = record[propertyRule.yaml]
    if (isDataPathRule(propertyRule) && typeof value === "string" && value.trim().length > 0) {
      occurrences.push({
        rule: propertyRule,
        value,
        setValue: (nextValue) => {
          record[propertyRule.yaml as string] = nextValue
        },
        yamlPath: [...params.yamlPath, propertyRule.yaml],
        ...(isElementType(params.rule.itemType) ? { elementType: params.rule.itemType } : {}),
        ...(hasYamlProperty(record, params.rule, "valuesPicture") ? { hasValuesPicture: true } : {}),
        ...(isYamlTrue(readYamlProperty(record, params.rule, "multipleValuesExtendedEdit"))
          ? { hasMultipleValuesExtendedEdit: true }
          : {}),
        ...(params.tableContext !== undefined && propertyRule.yaml === "ПутьКДанным"
          ? { tableContext: params.tableContext }
          : {}),
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

  for (const propertyRule of Object.values(params.rule.properties)) {
    if (typeof propertyRule.yaml !== "string" || isDataPathRule(propertyRule)) continue
    const value = record[propertyRule.yaml]
    const nested = collectNested({
      yaml: value,
      propertyRule,
      yamlPath: [...params.yamlPath, propertyRule.yaml],
      tableContext: childTableContext,
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
    const itemRule =
      descriptor.resolveItemRule?.({
        yaml,
        name: typeof name === "string" ? name : undefined,
        index,
        propertyRule: params.propertyRule,
      }) ?? descriptor.itemRule
    return collectItem({
      yaml,
      rule: itemRule,
      yamlPath: [...params.yamlPath, name],
      tableContext: params.tableContext,
    })
  })
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

function isDataPathRule(rule: PropertyRule): rule is DataPathPropertyRule {
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
