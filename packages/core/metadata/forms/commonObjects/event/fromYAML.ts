import { ConfigurationContext } from "~/metadata/context/types"
import { registerTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import type { EventsPropertyRule, PropertyRule } from "~/metadata/orchestration/property/types"

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
): Record<string, string> | undefined => {
  if (!isEventsPropertyRule(rule)) return undefined
  if (!value || typeof value !== "object") return undefined

  const yamlObj = value as Record<string, string>
  const result: Record<string, string> = {}

  for (const [ruleKey, yamlKey] of Object.entries(rule.items) as Array<[string, string]>) {
    const eventValue = yamlObj[yamlKey]
    if (eventValue === undefined) continue
    result[ruleKey] = eventValue
  }

  return isNonEmptyObject(result) ? result : undefined
}

registerTypeRule("Events", "importFromYAML", importEventsFromYAML)
