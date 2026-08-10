import { capitalize } from "@nkdk/runtime"
import type { ConfigurationContextWithExportToXML } from "@nkdk/runtime"
import { definePropertyTypeRule } from "../../../ruleRuntime/property/typeRuleRegistry"
import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { eventBindingKey } from "./callType"
import { EVENT_CALL_TYPES_XML, type EventCallTypeXML, type EventXML, type Events, type EventsXML } from "./types"
import { getReferenceEventXmlName } from "./fromXML"

const isEventsPropertyRule = (rule: PropertyRule): rule is PropertyRule & { items: Record<string, string> } => {
  return rule.type === "Events"
}

export const exportEventsToXML = (
  _context: ConfigurationContextWithExportToXML,
  _rule: PropertyRule,
  value: unknown,
  _referenceValue?: unknown
): EventsXML | undefined => {
  if (!value || typeof value !== "object") return undefined

  const dataEvents = value as Events

  const referenceEvents =
    _referenceValue && typeof _referenceValue === "object" ? (_referenceValue as Events) : undefined
  const knownEventKeys = isEventsPropertyRule(_rule) ? new Set(Object.keys(_rule.items)) : new Set<string>()

  const referenceBindings = referenceEvents === undefined ? [] : expandEventBindings(referenceEvents)
  const bindings = mergeEventBindings(expandEventBindings(dataEvents), referenceBindings, knownEventKeys)

  const items: EventXML[] = []
  for (const binding of bindings) {
    const xmlName =
      (referenceEvents === undefined ? undefined : getReferenceEventXmlName(referenceEvents, binding.key)) ??
      (referenceEvents !== undefined && binding.eventKey in referenceEvents && !knownEventKeys.has(binding.eventKey)
        ? binding.eventKey
        : capitalize(binding.eventKey))
    items.push({
      _name: xmlName,
      ...(binding.callType === undefined ? {} : { _callType: binding.callType }),
      "#text": binding.handler,
    })
  }

  if (items.length === 0) return undefined
  return { Event: items }
}

export const metadataPropertyRule000 = definePropertyTypeRule("Events", "exportToXML", exportEventsToXML)

interface EventBinding {
  readonly key: string
  readonly eventKey: string
  readonly callType?: EventCallTypeXML
  readonly handler: string
}

function expandEventBindings(events: Events): EventBinding[] {
  return Object.entries(events).flatMap(([eventKey, value]) => {
    if (typeof value === "string") {
      return [{ key: eventBindingKey(eventKey), eventKey, handler: value }]
    }
    const yamlCallTypes = Object.keys(value).filter(isEventCallType)
    const callTypes = yamlCallTypes.length === 0 ? EVENT_CALL_TYPES_XML : yamlCallTypes
    return callTypes.flatMap((callType) => {
      const handler = value[callType]
      return handler === undefined ? [] : [{ key: eventBindingKey(eventKey, callType), eventKey, callType, handler }]
    })
  })
}

function mergeEventBindings(
  dataBindings: readonly EventBinding[],
  referenceBindings: readonly EventBinding[],
  knownEventKeys: ReadonlySet<string>
): EventBinding[] {
  const dataEventKeys = new Set(dataBindings.map(({ eventKey }) => eventKey))
  return [
    ...dataBindings,
    ...referenceBindings.filter(
      (referenceBinding) =>
        !knownEventKeys.has(referenceBinding.eventKey) &&
        !dataEventKeys.has(referenceBinding.eventKey)
    ),
  ]
}

function isEventCallType(value: string): value is EventCallTypeXML {
  return EVENT_CALL_TYPES_XML.includes(value as EventCallTypeXML)
}
