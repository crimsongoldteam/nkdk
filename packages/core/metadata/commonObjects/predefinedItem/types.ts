import { registerMetadataItemCollectionRule, registerMetadataItemRule } from "../../orchestration"
import { MetadataTypeByRule } from "../../orchestration/metadataItem/element"
import { YAMLTypeByRule } from "../../orchestration/metadataItem/yaml"
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

function normalizePredefinedItemTypePrefixes(
  xml: Record<string, unknown>,
  depth = 0
): Record<string, unknown> {
  const prefix = `d${4 + depth * 2}p1`
  const type = asRecord(xml.Type)
  const qname = asRecord(type?.["v8:Type"])
  const namespaceEntry = Object.entries(qname ?? {}).find(
    ([key, value]) => key.startsWith("_xmlns:") && value === CURRENT_CONFIG_NAMESPACE
  )
  const text = qname?.["#text"]
  let result = xml

  if (type !== undefined && qname !== undefined && namespaceEntry !== undefined && typeof text === "string") {
    const sourcePrefix = namespaceEntry[0].slice("_xmlns:".length)
    if (text.startsWith(`${sourcePrefix}:`)) {
      const qnameRest = { ...qname }
      delete qnameRest[namespaceEntry[0]]
      result = {
        ...result,
        Type: {
          ...type,
          "v8:Type": {
            ...qnameRest,
            "#text": `${prefix}:${text.slice(sourcePrefix.length + 1)}`,
            [`_xmlns:${prefix}`]: CURRENT_CONFIG_NAMESPACE,
          },
        },
      }
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

registerMetadataItemRule({
  propertyType: "PredefinedItem",
  itemRule: PredefinedItemRules,
})

registerMetadataItemCollectionRule({
  propertyType: "PredefinedItemCollection",
  itemRule: PredefinedItemRules,
  xmlElement: "Item",
  keyField: "name",
  configurationIndexUidSegment: "Предопределенный",
  mapItemOutput: ({ xml }) => normalizePredefinedItemTypePrefixes(xml),
})
