import { capitalize } from "@nkdk/runtime"
import type { ConfigurationContextWithExportToXML } from "@nkdk/runtime"
import { definePropertyTypeRule } from "../../../ruleRuntime/property/typeRuleRegistry"
import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { EVENT_CALL_TYPES_XML, type EventCallTypeXML, type EventXML, type Events, type EventsXML } from "./types"

export const exportEventsToXML = (
  _context: ConfigurationContextWithExportToXML,
  _rule: PropertyRule,
  value: unknown,
): EventsXML | undefined => {
  if (!value || typeof value !== "object") return undefined

  const dataEvents = value as Events

  const bindings = expandEventBindings(dataEvents)

  const items: EventXML[] = []
  for (const binding of bindings) {
    const xmlName = capitalize(binding.eventKey)
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
  readonly eventKey: string
  readonly callType?: EventCallTypeXML
  readonly handler: string
}

function expandEventBindings(events: Events): EventBinding[] {
  return Object.entries(events).flatMap(([eventKey, value]) => {
    if (typeof value === "string") {
      return [{ eventKey, handler: value }]
    }
    const yamlCallTypes = Object.keys(value).filter(isEventCallType)
    const callTypes = yamlCallTypes.length === 0 ? EVENT_CALL_TYPES_XML : yamlCallTypes
    return callTypes.flatMap((callType) => {
      const handler = value[callType]
      return handler === undefined ? [] : [{ eventKey, callType, handler }]
    })
  })
}

function isEventCallType(value: string): value is EventCallTypeXML {
  return EVENT_CALL_TYPES_XML.includes(value as EventCallTypeXML)
}
