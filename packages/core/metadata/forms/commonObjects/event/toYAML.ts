import { ConfigurationContext } from "../../../context/types"
import { registerTypeRule } from "../../../orchestration/property/typeRuleRegistry"
import type { EventsPropertyRule, PropertyRule } from "../../../orchestration/property/types"
import { eventCallTypeToYAML } from "./callType"
import type { EventCallHandlers, EventCallHandlersYAML, Events, EventsYAML } from "./types"

const isNonEmptyObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value) && Object.keys(value as object).length > 0
}

const isEventsPropertyRule = (rule: PropertyRule): rule is EventsPropertyRule => {
  return rule.type === "Events"
}

export const exportEventsToYAML = (
  _context: ConfigurationContext,
  rule: PropertyRule,
  value: unknown
): EventsYAML | undefined => {
  if (!isEventsPropertyRule(rule)) return undefined
  if (!value || typeof value !== "object") return undefined

  const dataEvents = value as Events
  const result: EventsYAML = {}

  for (const [ruleKey, yamlKey] of Object.entries(rule.items) as Array<[string, string]>) {
    const eventValue = dataEvents[ruleKey]
    if (eventValue === undefined) continue
    const yamlValue = eventValueToYAML(eventValue, yamlKey)
    if (yamlValue !== undefined) result[yamlKey] = yamlValue
  }
  for (const [key, eventValue] of Object.entries(dataEvents)) {
    if (Object.prototype.hasOwnProperty.call(rule.items, key)) continue
    const yamlValue = eventValueToYAML(eventValue, key)
    if (yamlValue !== undefined) result[key] = yamlValue
  }

  return isNonEmptyObject(result) ? result : undefined
}

function eventValueToYAML(
  value: string | EventCallHandlers,
  eventName: string
): string | EventCallHandlersYAML | undefined {
  if (typeof value === "string") return value
  if (!isNonEmptyObject(value)) return undefined

  const result: EventCallHandlersYAML = {}
  for (const [callType, handlerName] of Object.entries(value)) {
    if (!isEventCallTypeXML(callType)) {
      throw new Error(`Недопустимый режим события ${eventName} и режима ${callType}`)
    }
    if (typeof handlerName !== "string") continue
    result[eventCallTypeToYAML(callType)] = handlerName
  }

  return isNonEmptyObject(result) ? result : undefined
}

function isEventCallTypeXML(value: string): value is keyof EventCallHandlers {
  return value === "Before" || value === "After" || value === "Override"
}

registerTypeRule("Events", "exportToYAML", exportEventsToYAML)
