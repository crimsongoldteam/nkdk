import {
  childUid,
  indexedUid,
  isXmlElementNode,
  xmlAttributeValue,
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
import { FormAttributeAdditionalColumnRules, FormAttributeColumnRules, FormAttributeRules } from "./rules"
import { hasSoleValueListType } from "./valueListSettings"
import { isMetadataNameYAML } from "../../../commonObjects/metadataName/types"
import { collapseKnownDuplicateErpAdditionalColumns } from "../../knownAnomalies"
import { namedXmlInputs } from "../namedXmlInputs"

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
  const itemXmlNodes = traversal.xmlNodes?.flatMap((node) => node.name === "Attribute" ? [node] : xmlElementChildren(node, "Attribute"))
  const source = itemXmlNodes === undefined ? objectRecordOrUndefined(xml)?.Attribute ?? xml : undefined
  const items = itemXmlNodes === undefined
    ? Array.isArray(source) ? source : source === undefined ? [] : [source]
    : itemXmlNodes
  const entries: FormAttributeImportEntry[] = []
  const importedItems: CollectableFormAttributeItem[] = []
  const collection = getConfigurationIndexCollectionContext(context)

  for (const { name, source: item, node: itemXmlNode } of namedXmlInputs(items)) {
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
      xml: itemXmlNode ?? item,
      name,
      traversal: {
        ...itemTraversal,
        ...(itemXmlNode === undefined ? {} : { xmlNodes: [itemXmlNode] }),
      },
    })
    if (yamlValue === undefined) continue
    const yaml = objectRecordOrUndefined(yamlValue)
    if (yaml === undefined) throw new Error(`Реквизит формы ${name} должен преобразовываться в YAML-объект`)
    if (traversal.dependencies === undefined && !hasSoleValueListType(itemXmlNode ?? item)) delete yaml.ТипЗначения
    appendFormAttributeItem(entries, importedItems, name, yaml, itemTraversal, itemXmlNode)
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
  const items = params.xmlNodes ?? formAttributeCollectionItems(params.xml)
  const entries: FormAttributeImportEntry[] = []
  const importedItems: ProjectedFormAttributeItem[] = []
  const collection = getConfigurationIndexCollectionContext(params.context)

  for (const [index, value] of items.entries()) {
    const itemNode = isXmlElementNode(value) ? value : undefined
    const item = itemNode === undefined ? objectRecordOrUndefined(value) : undefined
    const table = itemNode === undefined ? item?._table : xmlAttributeValue(itemNode, "table")
    if (typeof table !== "string") continue
    if (itemNode !== undefined) {
      const boundary = {
        itemType: "FormAttributeAdditionalColumn",
        yamlPath: [...params.traversal.yamlPath, table],
        rulePath: enterNestedYamlRule(params.traversal, "FormAttributeAdditionalColumn").rulePath,
      }
      // Здесь потребляется только оболочка и table; Column принадлежит своему item.
      params.traversal.audit?.claim(itemNode, boundary)
      const tableAttribute = itemNode.attributes.find(({ name }) => name === "table")
      if (tableAttribute !== undefined) params.traversal.audit?.claim(tableAttribute, boundary)
    }
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
    const columnNodes = itemNode === undefined ? undefined : xmlElementChildren(itemNode, "Column")
    const columnItems = columnNodes ?? formAttributeCollectionItems(item?.Column)
    const collapsed = collapseKnownDuplicateErpAdditionalColumns({
      currentXMLPath: params.context.fromXML.currentXMLPath,
      table,
      columns: columnItems,
      columnName: (column) => {
        const name = isXmlElementNode(column) ? xmlAttributeValue(column, "name") : objectRecordOrUndefined(column)?._name
        return typeof name === "string" ? name : undefined
      },
    })
    if (collapsed === undefined) {
      const itemTraversal = enterNestedYamlRule(
        { ...params.traversal, yamlPath: [...params.traversal.yamlPath, table] },
        FormAttributeAdditionalColumnRules.itemType,
      )
      const yaml = importMetadataItemFromXMLToYAML({
        context,
        rule: FormAttributeAdditionalColumnRules,
        xml: itemNode ?? item,
        name: table,
        traversal: {
          ...itemTraversal,
          ...(itemNode === undefined ? {} : { xmlNodes: [itemNode] }),
        },
      })
      // У inline-обёртки без Column смысловой результат пуст, но сама XML-
      // граница уже закрыта и должна остаться элементом коллекции.
      const yamlRecord = objectRecordOrUndefined(yaml) ?? {}
      entries.push({ key: table, value: yamlRecord })
      importedItems.push({
        sourceYamlPath: itemTraversal.yamlPath,
        ...(itemNode === undefined ? {} : { xmlNode: itemNode }),
      })
      continue
    }
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
      xml: collapsed.first,
      xmlNodes: collapsed === undefined || columnNodes === undefined ? columnNodes : columnNodes.slice(0, 1),
      traversal: {
        ...params.traversal,
        yamlPath: [...params.traversal.yamlPath, table],
        rulePath: [...params.traversal.rulePath, { propertyKey: "columns" }],
      },
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
  const items = params.xmlNodes ?? formAttributeCollectionItems(params.xml)
  const entries: FormAttributeImportEntry[] = []
  const importedItems: CollectableFormAttributeItem[] = []
  const duplicatedNames = duplicatedColumnNames(items)
  const collection = getConfigurationIndexCollectionContext(params.context)

  for (const [index, value] of items.entries()) {
    const itemXmlNode = isXmlElementNode(value) ? value : undefined
    const item = itemXmlNode === undefined ? objectRecordOrUndefined(value) : undefined
    const name = itemXmlNode === undefined ? item?._name : xmlAttributeValue(itemXmlNode, "name")
    if (typeof name !== "string") continue
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
    const id = itemXmlNode === undefined ? item?._id : xmlAttributeValue(itemXmlNode, "id")
    if (logicalAddress !== undefined && typeof id === "string") {
      collection?.collector.setIdentity(logicalAddress, "xmlId", id)
    }
    const itemTraversal = enterNestedYamlRule(
      { ...params.traversal, yamlPath: [...params.traversal.yamlPath, name] },
      FormAttributeColumnRules.itemType
    )
    const { xmlNodes: _parentXmlNodes, ...itemTraversalWithoutParentNodes } = itemTraversal
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
      appendFormAttributeItem(entries, importedItems, name, yamlRecord, itemTraversal, itemXmlNode)
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

function appendFormAttributeItem(
  entries: FormAttributeImportEntry[],
  importedItems: CollectableFormAttributeItem[],
  name: string,
  value: Record<string, unknown>,
  traversal: FormAttributeImportTraversal,
  xmlNode: XmlElementNode | undefined,
): void {
  entries.push({ key: name, value, ...(isMetadataNameYAML(name) ? {} : { invalid: true }) })
  importedItems.push({
    sourceYamlPath: traversal.yamlPath,
    ...(xmlNode === undefined ? {} : { xmlNode }),
    name,
    rulePath: traversal.rulePath,
  })
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
  for (const { name } of namedXmlInputs(items)) {
    if (name.length === 0) continue
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

export const metadataPropertyRule004 = definePropertyTypeRule(
  "FormAttributeColumns", "importFromXMLToYAML", ({ context, xml, traversal }) =>
    importColumnsFromXMLToYAML({ context, xml, traversal, xmlNodes: traversal.xmlNodes }),
)
export const metadataPropertyRule005 = definePropertyTypeRule(
  "FormAttributeAdditionalColumns", "importFromXMLToYAML", ({ context, xml, traversal }) =>
    importAdditionalColumnsFromXMLToYAML({ context, xml, traversal, xmlNodes: traversal.xmlNodes }),
)
