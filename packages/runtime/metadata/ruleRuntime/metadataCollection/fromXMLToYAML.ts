import type { ConfigurationContextFromXML } from "../../context/types"
import { objectRecordOrUndefined } from "../../../helpers/record"
import { importMetadataItemFromXMLToYAML } from "../metadataItem/fromXMLToYAML"
import type {
  DeferredValuePathCollector,
  DirectImportFactsSink,
  DirectImportTraversal,
  ImportedDependentPropertyCollector,
  ImportedDependentPropertyCandidate,
  LocalIndexesCollector,
  LocalYamlFact,
} from "../property/importYamlTypes"
import type { PropertyRuleType } from "../property/registry"
import type { ConfigurationIndexAddressingMode, MetadataItemRule, PropertyRule } from "../property/types"
import { enterNestedYamlRule } from "../property/yamlRuleCursor"
import { childUid, indexedUid, yamlIndexUid, yamlKeyUid } from "../../configurationIndex/logicalAddress"
import {
  getConfigurationIndexCollectionContext,
  withConfigurationIndexLogicalAddress,
} from "../../configurationIndex/collector/context"
import { isXmlElementNode, xmlAttributeValue, xmlElementsAtUniquePath, xmlElementChildren, xmlTextValue, type XmlElementNode } from "../../../xml/import/document"
import {
  arrayLengthXmlImportAttemptAdapter,
  attachXmlImportAttemptAdapter,
  createXmlImportBufferedLocalIndexes,
} from "../xmlAnomaly/attempt"
import { projectNamedXmlCollectionForImportWithRuntimeKeys } from "../xmlAnomaly/yamlProjection"
import { markYAMLScalarTag, yamlValueTag } from "../../../yaml/scalarTags"
import { createDirectImportFactsCollector } from "../property/importYamlTypes"

type MetadataItemCollectionImportOptions = {
  propertyType?: PropertyRuleType
  configurationIndexUidSegment?: string
  configurationIndexAddressing?: ConfigurationIndexAddressingMode
  yamlAsArray?: true
}

export type ClassifyNamedCollectionYamlKey = (params: {
  yaml: Record<string, unknown>
  name: string
  yamlKey: string
}) => "valid" | "invalid"

function configurationIndexItemContext(params: {
  context: ConfigurationContextFromXML
  itemName: string | undefined
  itemRule: MetadataItemRule
  index: number
  options?: MetadataItemCollectionImportOptions
}): ConfigurationContextFromXML {
  const { context, itemName, itemRule, index, options } = params
  const collection = getConfigurationIndexCollectionContext(context)
  if (collection === undefined) return context
  const useYamlPath = collection.yamlPathAddressing === true || options?.configurationIndexAddressing === "yamlPath"
  if (useYamlPath) {
    return withConfigurationIndexLogicalAddress(
      context,
      options?.yamlAsArray === true || itemName === undefined
        ? yamlIndexUid(collection.logicalAddress, index)
        : yamlKeyUid(collection.logicalAddress, itemName)
    )
  }
  if (options?.configurationIndexUidSegment !== undefined && itemName === undefined) {
    throw new Error(
      `Адресуемая metadata-item коллекция ${options.propertyType ?? itemRule.itemType} содержит элемент без имени`
    )
  }
  const uidSegment = options?.configurationIndexUidSegment ?? collection.childCollectionUidSegment ?? itemRule.itemType
  return withConfigurationIndexLogicalAddress(
    context,
    itemName === undefined
      ? indexedUid(collection.logicalAddress, uidSegment, index)
      : childUid(collection.logicalAddress, uidSegment, itemName)
  )
}

export function importMetadataItemCollectionFromXMLToYAML(params: {
  context: ConfigurationContextFromXML
  rule: PropertyRule
  xml: unknown
  itemRule: MetadataItemRule
  xmlElement: string
  keyField?: string
  yamlAsArray?: true
  propertyType?: PropertyRuleType
  configurationIndexUidSegment?: string
  configurationIndexAddressing?: ConfigurationIndexAddressingMode
  preserveItemPropertyPresence?: true
  recordYamlKeyFromYAML?: (params: {
    yaml: Record<string, unknown>
    name: string
    propertyRule: PropertyRule
  }) => string
  classifyYamlKey?: ClassifyNamedCollectionYamlKey
  traversal: DirectImportTraversal
}): Record<string, unknown> | Array<Record<string, unknown>> | undefined {
  const sourceNodes = isXmlElementNode(params.xml) ? [params.xml]
    : Array.isArray(params.xml) && params.xml.every(isXmlElementNode) ? params.xml
    : params.traversal.xmlNodes
  if (params.traversal.audit !== undefined && sourceNodes !== undefined) {
    for (const source of sourceNodes) {
      if (source.name === params.xmlElement) continue
      // Оболочка коллекции известна; атрибуты и содержимое проверяются отдельно.
      params.traversal.audit.claim(source, {
        itemType: params.itemRule.itemType,
        yamlPath: params.traversal.yamlPath,
        rulePath: params.traversal.rulePath,
      })
    }
  }
  const items: Iterable<Record<string, unknown> | XmlElementNode> = sourceNodes === undefined
    ? normalizeCollectionItems(params.xml, params.xmlElement)
    : collectionItemNodes(sourceNodes, params.xmlElement)
  const iterator = items[Symbol.iterator]()
  let next = iterator.next()
  if (next.done) return undefined
  const sourceItemRule = params.itemRule
  const itemRule =
    params.preserveItemPropertyPresence === true
      ? withPreservedPropertyPresence(sourceItemRule)
      : sourceItemRule
  const keyField = params.keyField
  const keyYaml = keyField === undefined ? undefined : (itemRule.properties[keyField]?.yaml ?? keyField)
  const importItem = (itemXml: Record<string, unknown> | XmlElementNode, index: number) => {
    const itemNode = isXmlElementNode(itemXml) ? itemXml : undefined
    const itemName = itemNameFromXML(itemXml, itemRule, params.keyField)
    const itemContext = configurationIndexItemContext({
      context: params.context,
      itemName,
      itemRule,
      index,
      options: {
        propertyType: params.propertyType,
        configurationIndexUidSegment: params.configurationIndexUidSegment,
        configurationIndexAddressing: params.configurationIndexAddressing,
        ...(params.yamlAsArray === true ? { yamlAsArray: true as const } : {}),
      },
    })
    const yamlPath =
      params.yamlAsArray === true
        ? [...params.traversal.yamlPath, index]
        : [...params.traversal.yamlPath, index]
    const bufferedCollector =
      params.yamlAsArray === true || keyYaml === undefined
        ? undefined
        : createXmlImportBufferedLocalIndexes(params.traversal.collector, yamlPath) ??
          createBufferedItemCollector(params.traversal.collector, yamlPath)
    const bufferedDeferred =
      bufferedCollector === undefined || params.traversal.deferred === undefined
        ? undefined
        : createBufferedDeferredCollector(params.traversal.deferred, yamlPath)
    const bufferedDependent =
      bufferedCollector === undefined || params.traversal.dependent === undefined
        ? undefined
        : createBufferedDependentCollector(params.traversal.dependent, yamlPath)
    const bufferedFacts = params.traversal.facts === undefined
      ? undefined : createDirectImportFactsCollector()
    const selectKey = (yaml: Record<string, unknown>) => {
      const name = itemName ?? String(index)
      const yamlKey = keyYaml === undefined ? undefined
        : (params.recordYamlKeyFromYAML?.({ yaml, name, propertyRule: params.rule })
          ?? (yaml[keyYaml] === undefined ? name : String(yaml[keyYaml])))
      const keyClassification = yamlKey === undefined ? undefined
        : params.classifyYamlKey?.({ yaml, name, yamlKey })
      if (params.yamlAsArray !== true && keyYaml !== undefined) delete yaml[keyYaml]
      return { name, yamlKey, keyClassification }
    }
    let selectedKey: ReturnType<typeof selectKey> | undefined
    const itemYamlValue = importMetadataItemFromXMLToYAML({
      context: itemContext,
      rule: itemRule,
      xml: itemNode ?? itemXml,
      name: itemName,
      beforeFinish: yaml => { selectedKey = selectKey(yaml) },
      traversal: enterNestedYamlRule(
        {
          ...params.traversal,
          ...(params.traversal.mode === "facts" ? { produceResult: false } : {}),
          yamlPath,
          collector: bufferedCollector?.collector ?? params.traversal.collector,
          deferred: bufferedDeferred?.collector ?? params.traversal.deferred,
          dependent: bufferedDependent?.collector ?? params.traversal.dependent,
          facts: bufferedFacts ?? params.traversal.facts,
        },
        itemRule.itemType
      ),
    })
    const bufferedPropertyFacts = bufferedFacts?.finish() ?? []
    if (itemYamlValue === undefined && params.traversal.mode !== "facts") return undefined
    const itemYaml = objectRecordOrUndefined(itemYamlValue)
      ?? (params.traversal.mode === "facts"
        ? factItemShallowView(bufferedPropertyFacts, yamlPath)
        : undefined)
    if (itemYaml === undefined) {
      throw new Error(`Элемент коллекции ${itemRule.itemType} должен преобразовываться в YAML-объект`)
    }
    const { name, yamlKey, keyClassification } = selectedKey ?? selectKey(itemYaml)
    const itemRulePath = enterNestedYamlRule(params.traversal, itemRule.itemType).rulePath
    if (params.yamlAsArray === true) {
      params.traversal.collector.acceptItem({
        itemType: itemRule.itemType,
        ...(itemName === undefined ? {} : { name: itemName }),
        yamlPath,
        rulePath: itemRulePath,
      })
    }
    if (params.yamlAsArray === true) {
      for (const fact of bufferedPropertyFacts) params.traversal.facts?.acceptProperty(fact)
    }
    return {
      yaml: itemYaml,
      name,
      yamlKey,
      keyClassification,
      sourceYamlPath: yamlPath,
      itemRulePath,
      bufferedCollector,
      bufferedDeferred,
      bufferedDependent,
      bufferedPropertyFacts: params.yamlAsArray === true ? [] : bufferedPropertyFacts,
      xmlNode: itemNode,
    }
  }
  const yamlItems: NonNullable<ReturnType<typeof importItem>>[] = []
  let itemIndex = 0
  while (!next.done) {
    const imported = importItem(next.value, itemIndex++)
    if (imported !== undefined) yamlItems.push(imported)
    next = iterator.next()
  }
  if (yamlItems.length === 0) return undefined

  if (params.yamlAsArray === true) {
    const result = yamlItems.map(({ yaml }) => yaml)
    result.forEach((yaml, index) => {
      const tag = yamlValueTag(yaml)
      if (tag !== undefined) markYAMLScalarTag(result, index, tag)
    })
    return result
  }

  if (keyYaml === undefined) return undefined
  const entries = yamlItems.map(({ yaml, yamlKey, keyClassification }) => {
    return {
      key: yamlKey!,
      value: yaml,
      ...(keyClassification === "invalid" ? { invalid: true } : {}),
    }
  })
  const projected = projectNamedXmlCollectionForImportWithRuntimeKeys({
    entries,
    annotations: params.traversal.annotations,
    ...(params.traversal.mode === "facts" ? { ephemeral: true as const } : {}),
  })
  for (const [index, item] of yamlItems.entries()) {
    const yamlKey = item.yamlKey!
    const runtimeKey = projected.runtimeKeys[index]!
    const tag = yamlValueTag(item.yaml)
    if (tag !== undefined) markYAMLScalarTag(projected.yaml, runtimeKey, tag)
    const targetYamlPath = [...params.traversal.yamlPath, runtimeKey]
    params.traversal.audit?.rekeyYamlPath(item.sourceYamlPath, targetYamlPath, item.xmlNode)
    params.traversal.collector.acceptItem({
      itemType: itemRule.itemType,
      name: yamlKey,
      yamlPath: targetYamlPath,
      rulePath: item.itemRulePath,
    })
    item.bufferedCollector?.flush(targetYamlPath)
    item.bufferedDeferred?.flush(targetYamlPath)
    item.bufferedDependent?.flush(targetYamlPath, yamlKey)
    for (const fact of item.bufferedPropertyFacts) {
      params.traversal.facts?.acceptProperty({
        ...fact,
        yamlPath: [...targetYamlPath, ...fact.yamlPath.slice(item.sourceYamlPath.length)],
      })
    }
  }
  return projected.yaml
}

function factItemShallowView(
  facts: readonly Parameters<DirectImportFactsSink["acceptProperty"]>[0][],
  itemYamlPath: readonly (string | number)[],
): Record<string, unknown> {
  return Object.fromEntries(facts.flatMap((fact) => {
    if (!isImmediateField(fact.yamlPath, itemYamlPath)) return []
    const key = fact.yamlPath.at(-1)
    if (typeof key !== "string") return []
    const finalFact = fact.propertyKey.startsWith("$container:")
      || fact.exportedToYAML === true
    if (!finalFact) return []
    return [[key, fact.value] as const]
  }))
}

function isImmediateField(path: readonly (string | number)[], parent: readonly (string | number)[]): boolean {
  return path.length === parent.length + 1
    && parent.every((segment, index) => segment === path[index])
}

function createBufferedDependentCollector(
  parent: ImportedDependentPropertyCollector,
  sourceItemYamlPath: readonly (string | number)[]
) {
  const candidates: ImportedDependentPropertyCandidate[] = []
  const collector: ImportedDependentPropertyCollector = {
    accept: (candidate) => candidates.push(candidate),
    finish: () => candidates,
  }
  attachXmlImportAttemptAdapter(
    collector,
    arrayLengthXmlImportAttemptAdapter([candidates]),
  )
  return {
    collector,
    flush(itemYamlPath: readonly (string | number)[], itemName: string) {
      for (const candidate of candidates) {
        parent.accept({
          ...candidate,
          itemName,
          itemYamlPath: [...itemYamlPath, ...candidate.itemYamlPath.slice(sourceItemYamlPath.length)],
          yamlPath: [...itemYamlPath, ...candidate.yamlPath.slice(sourceItemYamlPath.length)],
        })
      }
    },
  }
}

function withPreservedPropertyPresence(itemRule: MetadataItemRule): MetadataItemRule {
  return {
    ...itemRule,
    properties: Object.fromEntries(
      Object.entries(itemRule.properties).map(([key, rule]) => [
        key,
        { ...rule, preserveExplicitDefaultXML: true },
      ])
    ),
  }
}

function createBufferedDeferredCollector(
  parent: DeferredValuePathCollector,
  sourceValuePath: readonly (string | number)[]
) {
  const paths: Parameters<DeferredValuePathCollector["accept"]>[0][] = []
  const collector: DeferredValuePathCollector = {
    accept: (path) => paths.push(path),
    finish: () => paths,
  }
  attachXmlImportAttemptAdapter(
    collector,
    arrayLengthXmlImportAttemptAdapter([paths]),
  )
  return {
    collector,
    flush(valuePath: readonly (string | number)[]) {
      for (const path of paths) {
        parent.accept({
          ...path,
          valuePath: [...valuePath, ...path.valuePath.slice(sourceValuePath.length)],
        })
      }
    },
  }
}

function createBufferedItemCollector(parent: LocalIndexesCollector, sourceYamlPath: readonly (string | number)[]) {
  const facts: Array<
    | { kind: "item"; fact: Parameters<LocalIndexesCollector["acceptItem"]>[0] }
    | { kind: "property" | "complete"; fact: LocalYamlFact }
  > = []
  const collector: LocalIndexesCollector = {
    acceptItem: (fact) => facts.push({ kind: "item", fact }),
    acceptProperty: (fact) => facts.push({ kind: "property", fact }),
    completeValue: (fact) => facts.push({ kind: "complete", fact }),
    finish: () => parent.finish(),
  }
  attachXmlImportAttemptAdapter(
    collector,
    arrayLengthXmlImportAttemptAdapter([facts]),
  )

  return {
    collector,
    flush(yamlPath: readonly (string | number)[]) {
      for (const { kind, fact } of facts) {
        const nextYamlPath = [...yamlPath, ...fact.yamlPath.slice(sourceYamlPath.length)]
        if (kind === "item") parent.acceptItem({ ...fact, yamlPath: nextYamlPath })
        else if (kind === "property") parent.acceptProperty({ ...fact, yamlPath: nextYamlPath })
        else parent.completeValue({ ...fact, yamlPath: nextYamlPath })
      }
    },
  }
}

function* collectionItemNodes(
  sources: readonly XmlElementNode[],
  xmlElement: string,
): Iterable<XmlElementNode> {
  const direct = sources.every(({ name }) => name === xmlElement)
  for (const source of sources) {
    if (direct) {
      if (hasItemBody(source)) yield source
      continue
    }
    for (const node of source.content) {
      if (node.type === "element" && node.name === xmlElement
        && hasItemBody(node)) {
        yield node
      }
    }
  }
}

function hasItemBody(node: XmlElementNode): boolean {
  return node.attributes.length > 0 || node.content.some(child => child.type !== "text")
}

function normalizeCollectionItems(xml: unknown, xmlElement: string): Record<string, unknown>[] {
  if (Array.isArray(xml)) {
    const isWrapped = xml.every((entry) => objectRecordOrUndefined(entry)?.[xmlElement] !== undefined)
    const items = isWrapped
      ? xml.flatMap((entry) => toArray(objectRecordOrUndefined(entry)?.[xmlElement]))
      : xml
    return items.flatMap((item) => {
      const record = objectRecordOrUndefined(item)
      return record === undefined ? [] : [record]
    })
  }

  const record = objectRecordOrUndefined(xml)
  if (record === undefined) return []
  if (Object.keys(record).length === 0) return []
  const nested = record[xmlElement]
  return nested === undefined
    ? [record]
    : toArray(nested).flatMap((item) => {
        const itemRecord = objectRecordOrUndefined(item)
        return itemRecord === undefined ? [] : [itemRecord]
      })
}

function itemNameFromXML(xml: Record<string, unknown> | XmlElementNode, rule: MetadataItemRule, keyField?: string): string | undefined {
  if (isXmlElementNode(xml)) {
    const attributeName = xmlAttributeValue(xml, "name")
    if (attributeName !== undefined && attributeName.length > 0) return attributeName
    const nameRule = rule.properties[keyField ?? "name"]
    if (nameRule === undefined) return undefined
    const parents = xmlElementsAtUniquePath([xml], [xml.name, ...(nameRule.xmlParents ?? [])])
    if (parents.length !== 1) return undefined
    const key = nameRule.xml ?? "Name"
    if (key.startsWith("_")) return xmlAttributeValue(parents[0]!, key.slice(1)) || undefined
    const values = xmlElementChildren(parents[0]!, key)
    if (values.length !== 1 || values[0]!.attributes.length !== 0 || values[0]!.content.some(child => child.type !== "text")) return undefined
    return xmlTextValue(values[0]!) || undefined
  }
  if (typeof xml._name === "string" && xml._name.length > 0) return xml._name

  const nameRule = rule.properties[keyField ?? "name"]
  if (nameRule === undefined) return undefined
  let source: Record<string, unknown> | undefined = xml
  for (const parent of nameRule.xmlParents ?? []) source = objectRecordOrUndefined(source?.[parent])
  const value = source?.[nameRule.xml ?? "Name"]
  return typeof value === "string" && value.length > 0 ? value : undefined
}

function toArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [value]
}
