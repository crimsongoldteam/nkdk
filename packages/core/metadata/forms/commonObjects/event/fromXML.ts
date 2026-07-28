import { ConfigurationContextFromXML } from "../../../context/types"
import { registerTypeRule } from "../../../orchestration/property/typeRuleRegistry"
import type { EventsPropertyRule, PropertyRule } from "../../../orchestration/property/types"
import { eventBindingKey } from "./callType"
import type { EventCallTypeXML, EventXML, Events, EventsXML } from "./types"
import { getConfigurationIndexCollectionContext } from "../../../configurationIndex/collector/context"

const referenceXmlNames = new WeakMap<object, ReadonlyMap<string, string>>()

const isNonEmptyObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value) && Object.keys(value as object).length > 0
}

export const importEventsFromXML = (
  _context: ConfigurationContextFromXML,
  _rule: PropertyRule,
  value: unknown
): Events | undefined => {
  if (!value || typeof value !== "object") return undefined

  const eventsXML = value as EventsXML
  const events = Array.isArray(eventsXML.Event) ? eventsXML.Event : [eventsXML.Event]

  const result: Events = {}
  const aliases = new Map<string, string>()
  for (const event of events) {
    if (!isEventXML(event)) continue

    const key = eventRuleKey(_rule, event._name, event["#text"])
    const bindingKey = eventBindingKey(key, event._callType)
    const previous = result[key]

    if (event._callType === undefined) {
      if (previous !== undefined) throwBindingConflict(key, event._callType)
      result[key] = event["#text"]
    } else {
      if (typeof previous === "string") throwBindingConflict(key, event._callType)
      const handlers = previous ?? {}
      if (Object.hasOwn(handlers, event._callType)) throwBindingConflict(key, event._callType)
      handlers[event._callType] = event["#text"]
      result[key] = handlers
    }

    aliases.set(bindingKey, event._name)
  }

  if (!isNonEmptyObject(result)) return undefined
  referenceXmlNames.set(result, aliases)
  return result
}

export function getReferenceEventXmlName(value: object, key: string): string | undefined {
  return referenceXmlNames.get(value)?.get(key)
}

registerTypeRule("Events", "importFromXML", importEventsFromXML)
registerTypeRule("Events", "collectConfigurationIndexFromXML", ({ context, rule, xml }) => {
  const collection = getConfigurationIndexCollectionContext(context)
  if (collection === undefined || xml === null || typeof xml !== "object" || Array.isArray(xml)) return
  const source = (xml as EventsXML).Event
  const events = Array.isArray(source) ? source : source === undefined ? [] : [source]
  const order = events.flatMap((event) => {
    if (!isEventXML(event)) return []
    const key = eventRuleKey(rule, event._name, event["#text"])
    const bindingKey = eventBindingKey(key, event._callType)
    const canonicalName = `${key[0]!.toUpperCase()}${key.slice(1)}`
    if (event._name !== canonicalName) {
      collection.collector.setAlias(
        collection.xmlNodeLogicalAddress ?? collection.logicalAddress,
        bindingKey,
        event._name
      )
    }
    return [bindingKey]
  })
  if (order.length > 0) {
    collection.collector.setOrder(collection.xmlNodeLogicalAddress ?? collection.logicalAddress, order)
  }
})

function isEventXML(value: unknown): value is EventXML {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false
  const { _name: name, _callType: callType, "#text": text } = value as Record<string, unknown>
  return (
    typeof name === "string" &&
    name.length > 0 &&
    typeof text === "string" &&
    (callType === undefined || isEventCallType(callType))
  )
}

function isEventCallType(value: unknown): value is EventCallTypeXML {
  return value === "Before" || value === "After" || value === "Override"
}

function throwBindingConflict(key: string, callType: EventCallTypeXML | undefined): never {
  throw new Error(`Противоречивые XML-привязки события ${key} (${callType ?? "обычный вызов"})`)
}

function eventRuleKey(rule: PropertyRule, xmlName: string, handlerName: string): string {
  const canonicalKey = `${xmlName[0]!.toLowerCase()}${xmlName.slice(1)}`
  if (rule.type !== "Events") return canonicalKey
  const items = (rule as EventsPropertyRule).items
  if (Object.prototype.hasOwnProperty.call(items, canonicalKey)) return canonicalKey
  return Object.entries(items).find(([, yamlKey]) => yamlKey === handlerName)?.[0] ?? handlerName
}
