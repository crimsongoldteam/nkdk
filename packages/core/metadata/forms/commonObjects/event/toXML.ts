import { capitalize } from "../../../../helpers/capitalize"
import { ConfigurationContextWithExportToXML } from "../../../context/types"
import { registerTypeRule } from "../../../orchestration/property/typeRuleRegistry"
import type { PropertyRule } from "../../../orchestration/property/types"
import { eventBindingKey } from "./callType"
import { EVENT_CALL_TYPES_XML, type EventCallTypeXML, type EventXML, type Events, type EventsXML } from "./types"
import {
  getConfigurationIndexPropertyOrder,
  getConfigurationIndexSourceXmlKey,
  getConfigurationIndexXmlNodeLogicalAddress,
} from "../../../configurationIndex/referenceView"
import { getReferenceEventXmlName } from "./fromXML"

const isEventsPropertyRule = (rule: PropertyRule): rule is PropertyRule & { items: Record<string, string> } => {
  return rule.type === "Events"
}

export const exportEventsToXML = (
  context: ConfigurationContextWithExportToXML,
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
  const indexedOrder = getConfigurationIndexPropertyOrder(context)
  const sourceOrder = indexedOrder.length > 0 ? indexedOrder : referenceBindings.map(({ key }) => key)
  const orderIndex = new Map(sourceOrder.map((key, index) => [key, index]))
  bindings.sort((left, right) => compareBindings(left, right, orderIndex))

  const items: EventXML[] = []
  for (const binding of bindings) {
    const xmlName =
      getConfigurationIndexSourceXmlKey(context, binding.key) ??
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
  const runtime = context.exportToXML.configurationIndex
  if (runtime !== undefined) {
    runtime.collector.setOrder(
      getConfigurationIndexXmlNodeLogicalAddress(context) ?? runtime.logicalAddress,
      bindings.map(({ key }) => key)
    )
  }

  return { Event: items }
}

registerTypeRule("Events", "exportToXML", exportEventsToXML)

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
    return EVENT_CALL_TYPES_XML.flatMap((callType) => {
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
  const pending = new Map(dataBindings.map((binding) => [binding.key, binding]))
  const bindings: EventBinding[] = []
  for (const referenceBinding of referenceBindings) {
    const dataBinding = pending.get(referenceBinding.key)
    if (dataBinding !== undefined) {
      bindings.push(dataBinding)
      pending.delete(referenceBinding.key)
    } else if (!knownEventKeys.has(referenceBinding.eventKey)) {
      bindings.push(referenceBinding)
    }
  }
  return [...bindings, ...pending.values()]
}

function compareBindings(
  left: EventBinding,
  right: EventBinding,
  orderIndex: ReadonlyMap<string, number>
): number {
  const leftIndex = orderIndex.get(left.key)
  const rightIndex = orderIndex.get(right.key)
  if (leftIndex !== undefined || rightIndex !== undefined) {
    if (leftIndex === undefined) return 1
    if (rightIndex === undefined) return -1
    return leftIndex - rightIndex
  }

  const eventNameOrder = left.eventKey.localeCompare(right.eventKey)
  if (eventNameOrder !== 0) return eventNameOrder
  return callTypeOrder(left.callType) - callTypeOrder(right.callType)
}

function callTypeOrder(callType: EventCallTypeXML | undefined): number {
  return callType === undefined ? -1 : EVENT_CALL_TYPES_XML.indexOf(callType)
}
