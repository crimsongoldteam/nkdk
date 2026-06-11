import { ConfigurationContext } from "~/metadata/context/types"
import { registerTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import { EventsPropertyRule, PropertyRule } from "~/metadata/orchestration/property/types"

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
): Record<string, string> | undefined => {
  if (!isEventsPropertyRule(rule)) return undefined
  if (!value || typeof value !== "object") return undefined

  const dataEvents = value as Record<string, string>
  const result: Record<string, string> = {}

  for (const [ruleKey, yamlKey] of Object.entries(rule.items) as Array<[string, string]>) {
    const eventValue = dataEvents[ruleKey]
    if (eventValue === undefined) continue
    result[yamlKey] = eventValue
  }

  return isNonEmptyObject(result) ? result : undefined
}

registerTypeRule("Events", "exportToYAML", exportEventsToYAML)
