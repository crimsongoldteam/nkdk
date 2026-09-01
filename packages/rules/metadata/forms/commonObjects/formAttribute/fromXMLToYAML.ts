import {
  childUid,
  indexedUid,
  objectRecordOrUndefined,
  projectNamedXmlCollectionForImportWithRuntimeKeys,
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
import { collapseKnownDuplicateErpAdditionalColumns } from "../../knownAnomalies"

type FormAttributeImportTraversal = Parameters<ImportFromXMLToYAMLFunction>[0]["traversal"]

type FormAttributeCollectionImportParams = {
  context: Parameters<ImportFromXMLToYAMLFunction>[0]["context"]
  xml: unknown
  xmlNodes?: readonly XmlElementNode[]
  traversal: FormAttributeImportTraversal
}

type FormAttributeImportEntry = {
  key: string
  value: Record<string, unknown>
  invalid?: true
}

type ProjectedFormAttributeItem = {
  sourceYamlPath: readonly (string | number)[]
  xmlNode?: XmlElementNode
}

type CollectableFormAttributeItem = ProjectedFormAttributeItem & {
  name: string
  rulePath: FormAttributeImportTraversal["rulePath"]
}

export const importFormAttributesFromXMLToYAML: ImportFromXMLToYAMLFunction = ({ context, xml, traversal }) => {
  const source = objectRecordOrUndefined(xml)?.Attribute ?? xml
  const itemXmlNodes = traversal.xmlNodes?.flatMap((node) => xmlElementChildren(node, "Attribute"))
  const items = itemXmlNodes === undefined
    ? Array.isArray(source) ? source : source === undefined ? [] : [source]
    : itemXmlNodes.map(({ compatibilityValue }) => compatibilityValue)
  const entries: FormAttributeImportEntry[] = []
  const importedItems: CollectableFormAttributeItem[] = []
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
    entries.push({
      key: name,
      value: yaml,
      ...(isMetadataNameYAML(name) ? {} : { invalid: true }),
    })
    importedItems.push({
      sourceYamlPath: itemTraversal.yamlPath,
      ...(itemXmlNodes?.[index] === undefined ? {} : { xmlNode: itemXmlNodes[index] }),
      name,
      rulePath: itemTraversal.rulePath,
    })
  }

  const projected = projectFormAttributeCollection({
    entries,
    importedItems,
    traversal,
  })
  if (projected === undefined) return undefined
  for (const [index, item] of importedItems.entries()) {
    traversal.collector.acceptItem({
      itemType: FormAttributeRules.itemType,
      name: item.name,
      yamlPath: projected.yamlPaths[index]!,
      rulePath: item.rulePath,
    })
  }
  return projected.yaml
}

function importAdditionalColumnsFromXMLToYAML(
  params: FormAttributeCollectionImportParams,
): Record<string, unknown> | undefined {
  const items = formAttributeCollectionItems(params.xml)
  const entries: FormAttributeImportEntry[] = []
  const importedItems: ProjectedFormAttributeItem[] = []
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
    const columnItems = formAttributeCollectionItems(item.Column)
    const columnNodes = params.xmlNodes?.[index] === undefined
      ? undefined
      : xmlElementChildren(params.xmlNodes[index]!, "Column")
    const collapsed = collapseKnownDuplicateErpAdditionalColumns({
      currentXMLPath: params.context.fromXML.currentXMLPath,
      table,
      columns: columnItems,
      columnName: (column) => {
        const name = objectRecordOrUndefined(column)?._name
        return typeof name === "string" ? name : undefined
      },
    })
    if (collapsed !== undefined && columnNodes?.length === columnItems.length) {
      const omittedNodes = columnNodes.slice(1)
      const itemTraversal = enterNestedYamlRule(
        { ...params.traversal, yamlPath: [...params.traversal.yamlPath, table, "Реквизит1"] },
        FormAttributeColumnRules.itemType,
      )
      const boundary = {
        itemType: FormAttributeColumnRules.itemType,
        yamlPath: itemTraversal.yamlPath,
        rulePath: itemTraversal.rulePath,
      }
      for (const node of omittedNodes) {
        const audit = params.traversal.audit
        if (audit === undefined) continue
        const outcome = audit.getOutcome(node)
        const effectiveBoundary = outcome.boundaries.length === 1 ? outcome.boundaries[0]! : boundary
        if (outcome.state === "unclaimed" || outcome.state === "unknown") {
          audit.claim(node, effectiveBoundary)
        }
        audit.claimStructuralSubtree(node, effectiveBoundary)
      }
    }
    const columns = importColumnsFromXMLToYAML({
      context,
      xml: collapsed === undefined ? item.Column : collapsed.first,
      xmlNodes: collapsed === undefined || columnNodes === undefined ? columnNodes : columnNodes.slice(0, 1),
      traversal: { ...params.traversal, yamlPath: [...params.traversal.yamlPath, table] },
    })
    entries.push({ key: table, value: columns ?? {} })
    importedItems.push({
      sourceYamlPath: [...params.traversal.yamlPath, table],
      ...(params.xmlNodes?.[index] === undefined ? {} : { xmlNode: params.xmlNodes[index] }),
    })
  }

  return projectFormAttributeCollection({
    entries,
    importedItems,
    traversal: params.traversal,
  })?.yaml
}

function importColumnsFromXMLToYAML(
  params: FormAttributeCollectionImportParams,
): Record<string, unknown> | undefined {
  const items = formAttributeCollectionItems(params.xml)
  const entries: FormAttributeImportEntry[] = []
  const importedItems: CollectableFormAttributeItem[] = []
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
      entries.push({
        key: name,
        value: yamlRecord,
        ...(isMetadataNameYAML(name) ? {} : { invalid: true }),
      })
      importedItems.push({
        sourceYamlPath: itemTraversal.yamlPath,
        ...(itemXmlNode === undefined ? {} : { xmlNode: itemXmlNode }),
        name,
        rulePath: itemTraversal.rulePath,
      })
    }
  }

  const projected = projectFormAttributeCollection({
    entries,
    importedItems,
    traversal: params.traversal,
  })
  if (projected === undefined) return undefined
  for (const [index, item] of importedItems.entries()) {
    params.traversal.collector.acceptItem({
      itemType: FormAttributeColumnRules.itemType,
      name: item.name,
      yamlPath: projected.yamlPaths[index]!,
      rulePath: item.rulePath,
    })
  }
  return projected.yaml
}

function projectFormAttributeCollection(params: {
  entries: readonly FormAttributeImportEntry[]
  importedItems: readonly ProjectedFormAttributeItem[]
  traversal: FormAttributeImportTraversal
}): { yaml: Record<string, unknown>; yamlPaths: readonly (readonly (string | number)[])[] } | undefined {
  if (params.entries.length === 0) return undefined
  const projected = projectNamedXmlCollectionForImportWithRuntimeKeys({
    entries: params.entries,
    annotations: params.traversal.annotations,
    ...(params.traversal.mode === "facts" ? { ephemeral: true as const } : {}),
  })
  const yamlPaths = params.importedItems.map((item, index) => {
    const runtimeKey = projected.runtimeKeys[index]!
    const yamlPath = [...params.traversal.yamlPath, runtimeKey]
    if (runtimeKey !== item.sourceYamlPath.at(-1)) {
      params.traversal.audit?.rekeyYamlPath(item.sourceYamlPath, yamlPath, item.xmlNode)
    }
    return yamlPath
  })
  return { yaml: projected.yaml, yamlPaths }
}

function formAttributeCollectionItems(value: unknown): readonly unknown[] {
  return Array.isArray(value) ? value : value === undefined ? [] : [value]
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
