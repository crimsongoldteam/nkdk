import { defineMetadataItemCollectionRule, defineMetadataItemRule } from "../../ruleRuntime"
import { MetadataTypeByRule } from "../../ruleRuntime/metadataItem/element"
import { YAMLTypeByRule } from "../../ruleRuntime/metadataItem/yaml"
import { PredefinedItemRules } from "./rules"
import { yamlScalarTagAt } from "@nkdk/runtime"

export type PredefinedItem = MetadataTypeByRule<typeof PredefinedItemRules>
export type PredefinedItemYAML = YAMLTypeByRule<typeof PredefinedItemRules>

export type PredefinedItemCollection = PredefinedItem[]
export type PredefinedItemCollectionYAML = Record<string, PredefinedItemYAML>

const CURRENT_CONFIG_NAMESPACE = "http://v8.1c.ru/8.1/data/enterprise/current-config"

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined
}

function normalizeCurrentConfigQName(value: unknown, prefix: string, preservePrefix: boolean): unknown {
  if (preservePrefix) return value
  const qname = asRecord(value)
  const namespaceEntry = Object.entries(qname ?? {}).find(
    ([key, namespace]) => key.startsWith("_xmlns:") && namespace === CURRENT_CONFIG_NAMESPACE
  )
  const text = qname?.["#text"]
  if (qname === undefined || namespaceEntry === undefined || typeof text !== "string") return value

  const sourcePrefix = namespaceEntry[0].slice("_xmlns:".length)
  if (!text.startsWith(`${sourcePrefix}:`)) return value

  const result = { ...qname }
  delete result[namespaceEntry[0]]
  return {
    ...result,
    "#text": `${prefix}:${text.slice(sourcePrefix.length + 1)}`,
    [`_xmlns:${prefix}`]: CURRENT_CONFIG_NAMESPACE,
  }
}

function normalizePredefinedItemTypePrefixes(
  xml: Record<string, unknown>,
  yaml: unknown,
  depth = 0
): Record<string, unknown> {
  const prefix = `d${4 + depth * 2}p1`
  const type = asRecord(xml.Type)
  let result = xml

  if (type !== undefined) {
    let yamlTypeIndex = 0
    let normalizedType = type
    for (const container of ["v8:Type", "v8:TypeSet"] as const) {
      const source = type[container]
      if (source === undefined) continue
      const sourceValues = Array.isArray(source) ? source : [source]
      const normalizedValues = sourceValues.map((value, index) =>
        normalizeCurrentConfigQName(value, prefix, hasExplicitTypePrefix(yaml, yamlTypeIndex + index))
      )
      yamlTypeIndex += sourceValues.length
      normalizedType = {
        ...normalizedType,
        [container]: Array.isArray(source) ? normalizedValues : normalizedValues[0],
      }
    }
    result = { ...result, Type: normalizedType }
  }

  const childItems = asRecord(result.ChildItems)
  if (childItems === undefined || childItems.Item === undefined) return result
  const childItemsYAML = asRecord(asRecord(yaml)?.Элементы)
  const sourceItems = Array.isArray(childItems.Item) ? childItems.Item : [childItems.Item]
  const mappedItems = sourceItems.map((item) => {
    const record = asRecord(item)
    if (record === undefined) return item
    const childName = typeof record.Name === "string" ? record.Name : undefined
    const childYAML = childName === undefined ? undefined : childItemsYAML?.[childName]
    return normalizePredefinedItemTypePrefixes(record, childYAML, depth + 1)
  })
  return {
    ...result,
    ChildItems: {
      ...childItems,
      Item: Array.isArray(childItems.Item) ? mappedItems : mappedItems[0],
    },
  }
}

function hasExplicitTypePrefix(yaml: unknown, index: number): boolean {
  const item = asRecord(yaml)
  if (item === undefined) return false
  const type = item.ТипЗначения
  return Array.isArray(type)
    ? yamlScalarTagAt(type, index) === "xml"
    : index === 0 && yamlScalarTagAt(item, "ТипЗначения") === "xml"
}

export const metadataRuleLayer000 = defineMetadataItemRule({
  propertyType: "PredefinedItem",
  itemRule: PredefinedItemRules,
})

export const metadataRuleLayer001 = defineMetadataItemCollectionRule({
  propertyType: "PredefinedItemCollection",
  itemRule: PredefinedItemRules,
  xmlElement: "Item",
  keyField: "name",
  configurationIndexUidSegment: "Предопределенный",
  mapItemOutput: ({ xml, yaml }) => normalizePredefinedItemTypePrefixes(xml, yaml),
})
