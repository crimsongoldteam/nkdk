import { ConfigurationContextFromXML } from "../../../context/types"
import { registerTypeRule } from "../../../orchestration/property/typeRuleRegistry"
import type { EventsPropertyRule, PropertyRule } from "../../../orchestration/property/types"
import { eventBindingKey } from "./callType"
import type { EventCallTypeXML, EventXML, Events, EventsXML } from "./types"

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
  const parsedEvents = events.flatMap((event) => {
    const parsed = parseEventXML(event)
    return parsed === undefined ? [] : [parsed]
  })
  const eventKeys = eventRuleKeys(_rule, parsedEvents)

  const result: Events = {}
  const aliases = new Map<string, string>()
  for (const event of parsedEvents) {
    const key = eventKeys.get(event._name)!
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

function parseEventXML(value: unknown): EventXML | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined
  const { _name: name, _callType: callType, "#text": text } = value as Record<string, unknown>
  if (typeof name !== "string" || name.length === 0 || typeof text !== "string") return undefined
  if (callType !== undefined && !isEventCallType(callType)) {
    throw new Error(`Недопустимый callType XML-события ${name}: ${String(callType)}`)
  }
  return {
    _name: name,
    ...(callType === undefined ? {} : { _callType: callType }),
    "#text": text,
  }
}

function isEventCallType(value: unknown): value is EventCallTypeXML {
  return value === "Before" || value === "After" || value === "Override"
}

function throwBindingConflict(key: string, callType: EventCallTypeXML | undefined): never {
  throw new Error(`Противоречивые XML-привязки события ${key} (${callType ?? "обычный вызов"})`)
}

function eventRuleKeys(rule: PropertyRule, events: readonly EventXML[]): ReadonlyMap<string, string> {
  const handlersByXmlName = new Map<string, string[]>()
  for (const event of events) {
    const handlers = handlersByXmlName.get(event._name) ?? []
    handlers.push(event["#text"])
    handlersByXmlName.set(event._name, handlers)
  }
  return new Map(
    [...handlersByXmlName].map(([xmlName, handlerNames]) => [
      xmlName,
      eventRuleKey(rule, xmlName, handlerNames),
    ])
  )
}

function eventRuleKey(rule: PropertyRule, xmlName: string, handlerNames: readonly string[]): string {
  const canonicalKey = `${xmlName[0]!.toLowerCase()}${xmlName.slice(1)}`
  if (rule.type !== "Events") return canonicalKey
  const items = (rule as EventsPropertyRule).items
  if (Object.prototype.hasOwnProperty.call(items, canonicalKey)) return canonicalKey
  if (handlerNames.length === 1) {
    const handlerName = handlerNames[0]!
    return Object.entries(items).find(([, yamlKey]) => yamlKey === handlerName)?.[0] ?? canonicalKey
  }
  return canonicalKey
}
