import {
  childUid,
  indexedUid,
  objectRecordOrUndefined,
  projectNamedXmlCollectionForImport,
  type XmlElementNode,
  xmlElementChildren,
} from "@nkdk/runtime"
import {
  getConfigurationIndexCollectionContext,
  withConfigurationIndexLogicalAddress,
} from "@nkdk/runtime"
import { importMetadataItemFromXMLToYAML } from "../../../ruleRuntime/metadataItem/fromXMLToYAML"
import type { ImportFromXMLToYAMLFunction } from "@nkdk/runtime/rule-kit"
import { enterNestedYamlRule } from "../../../ruleRuntime/property/yamlRuleCursor"
import { definePropertyTypeRule } from "../../../ruleRuntime/property/typeRuleRegistry"
import { FormAttributeColumnRules, FormAttributeRules } from "./rules"
import { hasSoleValueListType } from "./valueListSettings"
import { isMetadataNameYAML } from "../../../commonObjects/metadataName/types"

type FormAttributeCollectionImportParams = {
  context: Parameters<ImportFromXMLToYAMLFunction>[0]["context"]
  xml: unknown
  xmlNodes?: readonly XmlElementNode[]
  traversal: Parameters<ImportFromXMLToYAMLFunction>[0]["traversal"]
}

export const importFormAttributesFromXMLToYAML: ImportFromXMLToYAMLFunction = ({ context, xml, traversal }) => {
  const source = objectRecordOrUndefined(xml)?.Attribute ?? xml
  const itemXmlNodes = traversal.xmlNodes?.flatMap((node) => xmlElementChildren(node, "Attribute"))
  const items = itemXmlNodes === undefined
    ? Array.isArray(source) ? source : source === undefined ? [] : [source]
    : itemXmlNodes.map(({ compatibilityValue }) => compatibilityValue)
  const entries: Array<{ key: string; value: Record<string, unknown>; invalid?: true }> = []
  const collection = getConfigurationIndexCollectionContext(context)

  for (const [index, value] of items.entries()) {
    const item = objectRecordOrUndefined(value)
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
      xml: itemXmlNodes?.[index] ?? item,
      name,
      traversal: {
        ...itemTraversal,
        ...(itemXmlNodes?.[index] === undefined ? {} : { xmlNodes: [itemXmlNodes[index]!] }),
      },
    })
    if (yamlValue === undefined) continue
    const yaml = objectRecordOrUndefined(yamlValue)
    if (yaml === undefined) throw new Error(`Реквизит формы ${name} должен преобразовываться в YAML-объект`)
    if (!hasSoleValueListType(item)) delete yaml.ТипЗначения
    const columnsXmlNode = itemXmlNodes?.[index] === undefined
      ? undefined
      : xmlElementChildren(itemXmlNodes[index]!, "Columns")[0]

    const columns = importColumnsFromXMLToYAML({
      context: itemContext,
      xml: objectRecordOrUndefined(item.Columns)?.Column,
      xmlNodes: columnsXmlNode === undefined ? undefined : xmlElementChildren(columnsXmlNode, "Column"),
      traversal: {
        ...itemTraversal,
        yamlPath: [...itemTraversal.yamlPath, "Колонки"],
        rulePath: [...itemTraversal.rulePath, { propertyKey: "columns" }],
      },
    })
    if (columns !== undefined) yaml.Колонки = columns

    const additionalColumns = importAdditionalColumnsFromXMLToYAML({
      context: itemContext,
      xml: objectRecordOrUndefined(item.Columns)?.AdditionalColumns,
      xmlNodes: columnsXmlNode === undefined
        ? undefined
        : xmlElementChildren(columnsXmlNode, "AdditionalColumns"),
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
    entries.push({
      key: name,
      value: yaml,
      ...(isMetadataNameYAML(name) ? {} : { invalid: true }),
    })
  }

  return entries.length === 0
    ? undefined
    : projectNamedXmlCollectionForImport({ entries, annotations: traversal.annotations })
}

function importAdditionalColumnsFromXMLToYAML(
  params: FormAttributeCollectionImportParams,
): Record<string, unknown> | undefined {
  const items = Array.isArray(params.xml) ? params.xml : params.xml === undefined ? [] : [params.xml]
  const entries: Array<{ key: string; value: Record<string, unknown> }> = []
  const collection = getConfigurationIndexCollectionContext(params.context)

  for (const [index, value] of items.entries()) {
    const item = objectRecordOrUndefined(value)
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
      xmlNodes: params.xmlNodes?.[index] === undefined
        ? undefined
        : xmlElementChildren(params.xmlNodes[index]!, "Column"),
      traversal: { ...params.traversal, yamlPath: [...params.traversal.yamlPath, table] },
    })
    entries.push({ key: table, value: columns ?? {} })
  }

  return entries.length === 0
    ? undefined
    : projectNamedXmlCollectionForImport({ entries, annotations: params.traversal.annotations })
}

function importColumnsFromXMLToYAML(
  params: FormAttributeCollectionImportParams,
): Record<string, unknown> | undefined {
  const items = Array.isArray(params.xml) ? params.xml : params.xml === undefined ? [] : [params.xml]
  const entries: Array<{ key: string; value: Record<string, unknown>; invalid?: true }> = []
  const duplicatedNames = duplicatedColumnNames(items)
  const collection = getConfigurationIndexCollectionContext(params.context)

  for (const [index, value] of items.entries()) {
    const item = objectRecordOrUndefined(value)
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
    const { xmlNodes: _parentXmlNodes, ...itemTraversalWithoutParentNodes } = itemTraversal
    const itemXmlNode = params.xmlNodes?.[index]
    const yaml = importMetadataItemFromXMLToYAML({
      context,
      rule: FormAttributeColumnRules,
      xml: itemXmlNode ?? item,
      name,
      traversal: {
        ...itemTraversalWithoutParentNodes,
        ...(itemXmlNode === undefined ? {} : { xmlNodes: [itemXmlNode] }),
      },
    })
    if (yaml !== undefined) {
      const yamlRecord = objectRecordOrUndefined(yaml)
      if (yamlRecord === undefined) throw new Error(`Колонка формы ${name} должна преобразовываться в YAML-объект`)
      params.traversal.collector.acceptItem({
        itemType: FormAttributeColumnRules.itemType,
        name,
        yamlPath: itemTraversal.yamlPath,
        rulePath: itemTraversal.rulePath,
      })
      entries.push({
        key: name,
        value: yamlRecord,
        ...(isMetadataNameYAML(name) ? {} : { invalid: true }),
      })
    }
  }

  return entries.length === 0
    ? undefined
    : projectNamedXmlCollectionForImport({ entries, annotations: params.traversal.annotations })
}

function duplicatedColumnNames(items: readonly unknown[]): ReadonlySet<string> {
  const seen = new Set<string>()
  const duplicated = new Set<string>()
  for (const value of items) {
    const name = objectRecordOrUndefined(value)?._name
    if (typeof name !== "string" || name.length === 0) continue
    if (seen.has(name)) duplicated.add(name)
    seen.add(name)
  }
  return duplicated
}

export const metadataPropertyRule000 = definePropertyTypeRule("FormAttributes", "importFromXMLToYAML", importFormAttributesFromXMLToYAML)
export const metadataPropertyRule001 = definePropertyTypeRule("FormAttributes", "nestedItemRule", { itemRule: FormAttributeRules })
export const metadataPropertyRule002 = definePropertyTypeRule("FormAttributeColumns", "nestedItemRule", { itemRule: FormAttributeColumnRules })
export const metadataPropertyRule003 = definePropertyTypeRule("FormAttributes", "xmlImportPropertyBehavior", {
  nestedItemsOwnXMLChildren: true,
})
