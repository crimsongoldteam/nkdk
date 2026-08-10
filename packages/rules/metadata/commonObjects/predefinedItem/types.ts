import { defineMetadataItemCollectionRule, defineMetadataItemRule } from "../../ruleRuntime"
import { MetadataTypeByRule } from "../../ruleRuntime/metadataItem/element"
import { YAMLTypeByRule } from "../../ruleRuntime/metadataItem/yaml"
import { PredefinedItemRules } from "./rules"

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

function normalizeCurrentConfigQName(value: unknown, prefix: string): unknown {
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
  depth = 0
): Record<string, unknown> {
  const prefix = `d${4 + depth * 2}p1`
  const type = asRecord(xml.Type)
  let result = xml

  if (type !== undefined && type["v8:Type"] !== undefined) {
    const sourceTypes = type["v8:Type"]
    const normalizedTypes = Array.isArray(sourceTypes)
      ? sourceTypes.map((value) => normalizeCurrentConfigQName(value, prefix))
      : normalizeCurrentConfigQName(sourceTypes, prefix)
    result = {
      ...result,
      Type: {
        ...type,
        "v8:Type": normalizedTypes,
      },
    }
  }

  const childItems = asRecord(result.ChildItems)
  if (childItems === undefined || childItems.Item === undefined) return result
  const sourceItems = Array.isArray(childItems.Item) ? childItems.Item : [childItems.Item]
  const mappedItems = sourceItems.map((item) => {
    const record = asRecord(item)
    return record === undefined ? item : normalizePredefinedItemTypePrefixes(record, depth + 1)
  })
  return {
    ...result,
    ChildItems: {
      ...childItems,
      Item: Array.isArray(childItems.Item) ? mappedItems : mappedItems[0],
    },
  }
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
  mapItemOutput: ({ xml }) => normalizePredefinedItemTypePrefixes(xml),
})
