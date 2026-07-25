import { ConfigurationContextFromXML } from "../../../context/types"
import { registerTypeRule } from "../../../orchestration/property/typeRuleRegistry"
import type { EventsPropertyRule, PropertyRule } from "../../../orchestration/property/types"
import type { EventsXML } from "./types"
import { getConfigurationIndexCollectionContext } from "../../../configurationIndex/collector/context"

const isNonEmptyObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value) && Object.keys(value as object).length > 0
}

export const importEventsFromXML = (
  _context: ConfigurationContextFromXML,
  _rule: PropertyRule,
  value: unknown
): Record<string, string> | undefined => {
  if (!value || typeof value !== "object") return undefined

  const eventsXML = value as EventsXML
  const events = Array.isArray(eventsXML.Event) ? eventsXML.Event : [eventsXML.Event]

  const result: Record<string, string> = {}
  for (const event of events) {
    if (!event || typeof event !== "object") continue
    const name = (event as any)._name as string | undefined
    const text = (event as any)["#text"] as string | undefined
    if (!name || text === undefined) continue

    const key = eventRuleKey(_rule, name, text)
    result[key] = text
  }

  return isNonEmptyObject(result) ? result : undefined
}

registerTypeRule("Events", "importFromXML", importEventsFromXML)
registerTypeRule("Events", "collectConfigurationIndexFromXML", ({ context, rule, xml }) => {
  const collection = getConfigurationIndexCollectionContext(context)
  if (collection === undefined || xml === null || typeof xml !== "object" || Array.isArray(xml)) return
  const source = (xml as EventsXML).Event
  const events = Array.isArray(source) ? source : source === undefined ? [] : [source]
  const order = events.flatMap((event) => {
    const name = event?._name
    const text = event?.["#text"]
    if (typeof name !== "string" || name.length === 0 || typeof text !== "string") return []
    const key = eventRuleKey(rule, name, text)
    const canonicalName = `${key[0]!.toUpperCase()}${key.slice(1)}`
    if (name !== canonicalName) {
      collection.collector.setAlias(collection.xmlNodeLogicalAddress ?? collection.logicalAddress, key, name)
    }
    return [key]
  })
  if (order.length > 0) {
    collection.collector.setOrder(collection.xmlNodeLogicalAddress ?? collection.logicalAddress, order)
  }
})

function eventRuleKey(rule: PropertyRule, xmlName: string, handlerName: string): string {
  const canonicalKey = `${xmlName[0]!.toLowerCase()}${xmlName.slice(1)}`
  if (rule.type !== "Events") return canonicalKey
  const items = (rule as EventsPropertyRule).items
  if (Object.prototype.hasOwnProperty.call(items, canonicalKey)) return canonicalKey
  return Object.entries(items).find(([, yamlKey]) => yamlKey === handlerName)?.[0] ?? handlerName
}
