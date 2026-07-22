import { childUid, indexedUid } from "../../../configurationIndex/logicalAddress"
import {
  getConfigurationIndexCollectionContext,
  withConfigurationIndexLogicalAddress,
} from "../../../configurationIndex/collector/context"
import { importMetadataItemFromXMLToYAML } from "../../../orchestration/metadataItem/fromXMLToYAML"
import type { ImportFromXMLToYAMLFunction } from "../../../orchestration/property/importYamlTypes"
import { enterNestedYamlRule } from "../../../orchestration/property/yamlRuleCursor"
import { registerTypeRule } from "../../../orchestration/property/typeRuleRegistry"
import { FormAttributeColumnRules, FormAttributeRules } from "./rules"

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
      logicalAddress === undefined ? params.context : withConfigurationIndexLogicalAddress(params.context, logicalAddress)
    const columns = importColumnsFromXMLToYAML({
      context,
      xml: item.Column,
      traversal: { ...params.traversal, yamlPath: [...params.traversal.yamlPath, table] },
    })
    if (columns !== undefined) result[table] = columns
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
      logicalAddress === undefined ? params.context : withConfigurationIndexLogicalAddress(params.context, logicalAddress)
    if (logicalAddress !== undefined && typeof item._id === "string") {
      collection?.collector.setXmlId(logicalAddress, item._id)
    }
    const yaml = importMetadataItemFromXMLToYAML({
      context,
      rule: FormAttributeColumnRules,
      xml: item,
      name,
      traversal: enterNestedYamlRule(
        { ...params.traversal, yamlPath: [...params.traversal.yamlPath, name] },
        FormAttributeColumnRules.itemType
      ),
    })
    if (yaml !== undefined) result[name] = yaml
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

registerTypeRule("FormAttributes", "importFromXMLToYAML", importFormAttributesFromXMLToYAML)
registerTypeRule("FormAttributes", "nestedItemRule", { itemRule: FormAttributeRules })
registerTypeRule("FormAttributeColumns", "nestedItemRule", { itemRule: FormAttributeColumnRules })
