import { childUid, indexedUid } from "@nkdk/runtime"
import {
  getConfigurationIndexCollectionContext,
  withConfigurationIndexLogicalAddress,
} from "@nkdk/runtime"
import { importMetadataItemFromXMLToYAML } from "../../../ruleRuntime/metadataItem/fromXMLToYAML"
import type { ImportFromXMLToYAMLFunction } from "@nkdk/runtime/rule-kit"
import { enterNestedYamlRule } from "../../../ruleRuntime/property/yamlRuleCursor"
import { definePropertyTypeRule } from "../../../ruleRuntime/property/typeRuleRegistry"
import { FormAttributeColumnRules, FormAttributeRules } from "./rules"
import { hasSoleValueListType } from "./settings"

export const importFormAttributesFromXMLToYAML: ImportFromXMLToYAMLFunction = ({ context, xml, traversal }) => {
  const source = asRecord(xml)?.Attribute ?? xml
  const items = Array.isArray(source) ? source : source === undefined ? [] : [source]
  const result: Record<string, unknown> = {}
  const collection = getConfigurationIndexCollectionContext(context)

  for (const value of items) {
    const item = asRecord(value)
    if (item === undefined || typeof item._name !== "string") continue
    const name = item._name
    const itemContext =
      collection === undefined
        ? context
        : withConfigurationIndexLogicalAddress(context, childUid(collection.logicalAddress, "Атрибут", name))
    const itemTraversal = enterNestedYamlRule(
      { ...traversal, yamlPath: [...traversal.yamlPath, name] },
      FormAttributeRules.itemType
    )
    const yamlValue = importMetadataItemFromXMLToYAML({
      context: itemContext,
      rule: FormAttributeRules,
      xml: item,
      name,
      traversal: itemTraversal,
    })
    if (yamlValue === undefined) continue
    const yaml = asRecord(yamlValue)
    if (yaml === undefined) throw new Error(`Реквизит формы ${name} должен преобразовываться в YAML-объект`)
    if (!hasSoleValueListType(item)) delete yaml.ТипЗначения

    const columns = importColumnsFromXMLToYAML({
      context: itemContext,
      xml: asRecord(item.Columns)?.Column,
      traversal: {
        ...itemTraversal,
        yamlPath: [...itemTraversal.yamlPath, "Колонки"],
        rulePath: [...itemTraversal.rulePath, { propertyKey: "columns" }],
      },
    })
    if (columns !== undefined) yaml.Колонки = columns

    const additionalColumns = importAdditionalColumnsFromXMLToYAML({
      context: itemContext,
      xml: asRecord(item.Columns)?.AdditionalColumns,
      traversal: {
        ...itemTraversal,
        yamlPath: [...itemTraversal.yamlPath, "ДополнительныеКолонки"],
        rulePath: [...itemTraversal.rulePath, { propertyKey: "additionalColumns" }],
      },
    })
    if (additionalColumns !== undefined) yaml.ДополнительныеКолонки = additionalColumns
    traversal.collector.acceptItem({
      itemType: FormAttributeRules.itemType,
      name,
      yamlPath: itemTraversal.yamlPath,
      rulePath: itemTraversal.rulePath,
    })
    result[name] = yaml
  }

  return Object.keys(result).length === 0 ? undefined : result
}

function importAdditionalColumnsFromXMLToYAML(params: {
  context: Parameters<ImportFromXMLToYAMLFunction>[0]["context"]
  xml: unknown
  traversal: Parameters<ImportFromXMLToYAMLFunction>[0]["traversal"]
}): Record<string, unknown> | undefined {
  const items = Array.isArray(params.xml) ? params.xml : params.xml === undefined ? [] : [params.xml]
  const result: Record<string, unknown> = {}
  const collection = getConfigurationIndexCollectionContext(params.context)

  for (const [index, value] of items.entries()) {
    const item = asRecord(value)
    if (item === undefined || typeof item._table !== "string") continue
    const table = item._table
    const logicalAddress =
      collection === undefined
        ? undefined
        : table.length > 0
          ? childUid(collection.logicalAddress, "ДополнительныеКолонки", table)
          : indexedUid(collection.logicalAddress, "ДополнительныеКолонки", index)
    const context =
      logicalAddress === undefined
        ? params.context
        : withConfigurationIndexLogicalAddress(params.context, logicalAddress)
    const columns = importColumnsFromXMLToYAML({
      context,
      xml: item.Column,
      traversal: { ...params.traversal, yamlPath: [...params.traversal.yamlPath, table] },
    })
    result[table] = columns ?? {}
  }

  return Object.keys(result).length === 0 ? undefined : result
}

function importColumnsFromXMLToYAML(params: {
  context: Parameters<ImportFromXMLToYAMLFunction>[0]["context"]
  xml: unknown
  traversal: Parameters<ImportFromXMLToYAMLFunction>[0]["traversal"]
}): Record<string, unknown> | undefined {
  const items = Array.isArray(params.xml) ? params.xml : params.xml === undefined ? [] : [params.xml]
  const result: Record<string, unknown> = {}
  const duplicatedNames = duplicatedColumnNames(items)
  const collection = getConfigurationIndexCollectionContext(params.context)

  for (const [index, value] of items.entries()) {
    const item = asRecord(value)
    if (item === undefined || typeof item._name !== "string") continue
    const name = item._name
    const logicalAddress =
      collection === undefined
        ? undefined
        : name.length > 0 && !duplicatedNames.has(name)
          ? childUid(collection.logicalAddress, "Колонка", name)
          : indexedUid(collection.logicalAddress, "Колонка", index)
    const context =
      logicalAddress === undefined
        ? params.context
        : withConfigurationIndexLogicalAddress(params.context, logicalAddress)
    if (logicalAddress !== undefined && typeof item._id === "string") {
      collection?.collector.setIdentity(logicalAddress, "xmlId", item._id)
    }
    const itemTraversal = enterNestedYamlRule(
      { ...params.traversal, yamlPath: [...params.traversal.yamlPath, name] },
      FormAttributeColumnRules.itemType
    )
    const yaml = importMetadataItemFromXMLToYAML({
      context,
      rule: FormAttributeColumnRules,
      xml: item,
      name,
      traversal: itemTraversal,
    })
    if (yaml !== undefined) {
      params.traversal.collector.acceptItem({
        itemType: FormAttributeColumnRules.itemType,
        name,
        yamlPath: itemTraversal.yamlPath,
        rulePath: itemTraversal.rulePath,
      })
      result[name] = yaml
    }
  }

  return Object.keys(result).length === 0 ? undefined : result
}

function duplicatedColumnNames(items: readonly unknown[]): ReadonlySet<string> {
  const seen = new Set<string>()
  const duplicated = new Set<string>()
  for (const value of items) {
    const name = asRecord(value)?._name
    if (typeof name !== "string" || name.length === 0) continue
    if (seen.has(name)) duplicated.add(name)
    seen.add(name)
  }
  return duplicated
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined
}

export const metadataPropertyRule000 = definePropertyTypeRule("FormAttributes", "importFromXMLToYAML", importFormAttributesFromXMLToYAML)
export const metadataPropertyRule001 = definePropertyTypeRule("FormAttributes", "nestedItemRule", { itemRule: FormAttributeRules })
export const metadataPropertyRule002 = definePropertyTypeRule("FormAttributeColumns", "nestedItemRule", { itemRule: FormAttributeColumnRules })
