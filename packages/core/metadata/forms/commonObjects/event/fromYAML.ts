import { ConfigurationContext } from "../../../context/types"
import { registerTypeRule } from "../../../orchestration/property/typeRuleRegistry"
import type { EventsPropertyRule, PropertyRule } from "../../../orchestration/property/types"
import { eventCallTypeFromYAML } from "./callType"
import type { EventCallHandlers, EventCallHandlersYAML, Events, EventsYAML } from "./types"

const isNonEmptyObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value) && Object.keys(value as object).length > 0
}

const isEventsPropertyRule = (rule: PropertyRule): rule is EventsPropertyRule => {
  return rule.type === "Events"
}

export const importEventsFromYAML = (
  _context: ConfigurationContext,
  rule: PropertyRule,
  value: unknown,
  _source?: unknown
): Events | undefined => {
  if (!isEventsPropertyRule(rule)) return undefined
  if (!value || typeof value !== "object") return undefined

  const yamlObj = value as EventsYAML
  const result: Events = {}

  for (const [ruleKey, yamlKey] of Object.entries(rule.items) as Array<[string, string]>) {
    const eventValue = yamlObj[yamlKey]
    if (eventValue === undefined) continue
    const modelValue = eventValueFromYAML(eventValue, yamlKey)
    if (modelValue !== undefined) result[ruleKey] = modelValue
  }
  const knownYamlKeys = new Set(Object.values(rule.items))
  for (const [key, eventValue] of Object.entries(yamlObj)) {
    if (knownYamlKeys.has(key)) continue
    const modelValue = eventValueFromYAML(eventValue, key)
    if (modelValue !== undefined) result[key] = modelValue
  }

  return isNonEmptyObject(result) ? result : undefined
}

function eventValueFromYAML(value: unknown, eventName: string): string | EventCallHandlers | undefined {
  if (typeof value === "string") return value
  if (!isNonEmptyObject(value)) return undefined

  const result: EventCallHandlers = {}
  for (const [callType, handlerName] of Object.entries(value)) {
    if (!isEventCallTypeYAML(callType)) {
      throw new Error(`Недопустимый режим события ${eventName} и режима ${callType}`)
    }
    if (typeof handlerName !== "string") continue
    result[eventCallTypeFromYAML(callType)] = handlerName
  }

  return isNonEmptyObject(result) ? result : undefined
}

function isEventCallTypeYAML(value: string): value is keyof EventCallHandlersYAML {
  return value === "Перед" || value === "После" || value === "Вместо"
}

registerTypeRule("Events", "importFromYAML", importEventsFromYAML)
