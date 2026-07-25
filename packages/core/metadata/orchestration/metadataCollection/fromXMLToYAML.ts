import type { ConfigurationContextFromXML } from "../../context/types"
import { importMetadataItemFromXMLToYAML } from "../metadataItem/fromXMLToYAML"
import type {
  DeferredValuePathCollector,
  DirectImportTraversal,
  LocalIndexesCollector,
  LocalYamlFact,
} from "../property/importYamlTypes"
import type { PropertyRuleType } from "../property/registry"
import type { ConfigurationIndexAddressingMode, ItemXML, MetadataItemRule, PropertyRule } from "../property/types"
import { enterNestedYamlRule } from "../property/yamlRuleCursor"
import { childUid, indexedUid, yamlIndexUid, yamlKeyUid } from "../../configurationIndex/logicalAddress"
import {
  getConfigurationIndexCollectionContext,
  getConfigurationIndexXmlNodeLogicalAddress,
  withConfigurationIndexLogicalAddress,
} from "../../configurationIndex/collector/context"

type MetadataItemCollectionImportOptions = {
  propertyType?: PropertyRuleType
  configurationIndexUidSegment?: string
  configurationIndexAddressing?: ConfigurationIndexAddressingMode
  yamlAsArray?: true
}

function configurationIndexItemContext(params: {
  context: ConfigurationContextFromXML
  item: ItemXML
  itemRule: MetadataItemRule
  index: number
  options?: MetadataItemCollectionImportOptions
}): ConfigurationContextFromXML {
  const { context, item, itemRule, index, options } = params
  const collection = getConfigurationIndexCollectionContext(context)
  if (collection === undefined) return context
  const itemName = configurationIndexItemName(item, itemRule)
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

function configurationIndexItemName(item: ItemXML, itemRule: MetadataItemRule): string | undefined {
  if (typeof item._name === "string" && item._name.length > 0) return item._name
  const nameRule = itemRule.properties.name
  if (nameRule === undefined) return undefined
  let source: unknown = item
  for (const parent of nameRule.xmlParents ?? []) {
    if (source === null || typeof source !== "object") return undefined
    source = (source as Record<string, unknown>)[parent]
  }
  if (source === null || typeof source !== "object") return undefined
  for (const key of [nameRule.xml ?? "Name", ...(nameRule.xmlAliases ?? [])]) {
    const value = (source as Record<string, unknown>)[key]
    if (typeof value === "string" && value.length > 0) return value
  }
  return undefined
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
  preserveOmittedItemNames?: true
  recordYamlKeyFromYAML?: (params: { yaml: Record<string, unknown>; name: string }) => string
  traversal: DirectImportTraversal
}): Record<string, unknown> | Array<Record<string, unknown>> | undefined {
  const items = normalizeCollectionItems(params.xml, params.xmlElement)
  if (items.length === 0) return undefined
  const itemRule =
    params.preserveItemPropertyPresence === true
      ? withPreservedPropertyPresence(params.itemRule)
      : params.itemRule
  const keyField = params.keyField
  const keyYaml = keyField === undefined ? undefined : (itemRule.properties[keyField]?.yaml ?? keyField)
  if (params.preserveOmittedItemNames === true) {
    const collection = getConfigurationIndexCollectionContext(params.context)
    const itemNames = items.map((item) => itemNameFromXML(item, itemRule, keyField))
    if (collection !== undefined && itemNames.every((name): name is string => name !== undefined)) {
      collection.collector.setOrder(
        getConfigurationIndexXmlNodeLogicalAddress(collection),
        [...new Set(itemNames)]
      )
    }
  }

  const yamlItems = items.flatMap((itemXml, index) => {
    const itemName = itemNameFromXML(itemXml, itemRule, params.keyField)
    const itemContext = configurationIndexItemContext({
      context: params.context,
      item: itemXml,
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
        : [...params.traversal.yamlPath, itemName ?? String(index)]
    const bufferedCollector =
      params.yamlAsArray === true || keyYaml === undefined || params.recordYamlKeyFromYAML === undefined
        ? undefined
        : createBufferedItemCollector(params.traversal.collector, yamlPath)
    const bufferedDeferred =
      bufferedCollector === undefined || params.traversal.deferred === undefined
        ? undefined
        : createBufferedDeferredCollector(params.traversal.deferred, yamlPath)
    const itemYamlValue = importMetadataItemFromXMLToYAML({
      context: itemContext,
      rule: itemRule,
      xml: itemXml,
      name: itemName,
      traversal: enterNestedYamlRule(
        {
          yamlPath,
          rulePath: params.traversal.rulePath,
          collector: bufferedCollector?.collector ?? params.traversal.collector,
          deferred: bufferedDeferred?.collector ?? params.traversal.deferred,
          profile: params.traversal.profile,
        },
        itemRule.itemType
      ),
    })
    if (itemYamlValue === undefined) return []
    const itemYaml = asRecord(itemYamlValue)
    if (itemYaml === undefined) {
      throw new Error(`Элемент коллекции ${itemRule.itemType} должен преобразовываться в YAML-объект`)
    }
    const name = itemName ?? String(index)
    const yamlKey =
      keyYaml === undefined
        ? undefined
        : (params.recordYamlKeyFromYAML?.({ yaml: itemYaml, name }) ??
          (itemYaml[keyYaml] === undefined ? name : String(itemYaml[keyYaml])))
    if (yamlKey !== undefined) {
      const targetYamlPath = [...params.traversal.yamlPath, yamlKey]
      bufferedCollector?.flush(targetYamlPath)
      bufferedDeferred?.flush(targetYamlPath)
    }
    return [{ yaml: itemYaml, name, yamlKey }]
  })
  if (yamlItems.length === 0) return undefined

  if (params.yamlAsArray === true) return yamlItems.map(({ yaml }) => yaml)

  if (keyYaml === undefined) return undefined
  return Object.fromEntries(
    yamlItems.map(({ yaml, yamlKey }) => {
      delete yaml[keyYaml]
      return [yamlKey!, yaml]
    })
  )
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
  return {
    collector: {
      accept: (path) => paths.push(path),
      finish: () => paths,
    } satisfies DeferredValuePathCollector,
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
  const facts: Array<{ kind: "property" | "complete"; fact: LocalYamlFact }> = []
  const collector: LocalIndexesCollector = {
    acceptProperty: (fact) => facts.push({ kind: "property", fact }),
    completeValue: (fact) => facts.push({ kind: "complete", fact }),
    finish: () => parent.finish(),
  }

  return {
    collector,
    flush(yamlPath: readonly (string | number)[]) {
      for (const { kind, fact } of facts) {
        const nextFact = {
          ...fact,
          yamlPath: [...yamlPath, ...fact.yamlPath.slice(sourceYamlPath.length)],
        }
        if (kind === "property") parent.acceptProperty(nextFact)
        else parent.completeValue(nextFact)
      }
    },
  }
}

function normalizeCollectionItems(xml: unknown, xmlElement: string): Record<string, unknown>[] {
  if (Array.isArray(xml)) {
    const isWrapped = xml.every((entry) => asRecord(entry)?.[xmlElement] !== undefined)
    const items = isWrapped ? xml.flatMap((entry) => toArray(asRecord(entry)?.[xmlElement])) : xml
    return items.flatMap((item) => {
      const record = asRecord(item)
      return record === undefined ? [] : [record]
    })
  }

  const record = asRecord(xml)
  if (record === undefined) return []
  if (Object.keys(record).length === 0) return []
  const nested = record[xmlElement]
  return nested === undefined
    ? [record]
    : toArray(nested).flatMap((item) => {
        const itemRecord = asRecord(item)
        return itemRecord === undefined ? [] : [itemRecord]
      })
}

function itemNameFromXML(xml: Record<string, unknown>, rule: MetadataItemRule, keyField?: string): string | undefined {
  if (typeof xml._name === "string" && xml._name.length > 0) return xml._name

  const nameRule = rule.properties[keyField ?? "name"]
  if (nameRule === undefined) return undefined
  let source: Record<string, unknown> | undefined = xml
  for (const parent of nameRule.xmlParents ?? []) source = asRecord(source?.[parent])
  const value = source?.[nameRule.xml ?? "Name"]
  return typeof value === "string" && value.length > 0 ? value : undefined
}

function toArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [value]
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined
}
