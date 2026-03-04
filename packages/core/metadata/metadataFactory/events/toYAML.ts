import { MetadataItem, MetadataItemRule } from "../properties/types"
import { Events } from "./types"

export const exportEventsToYAML = <T extends MetadataItem>(params: {
  rule: MetadataItemRule
  data: T | undefined
}): { События?: Record<string, string> } => {
  const { rule, data } = params
  if (!rule.events || !data || !("events" in data)) {
    return {}
  }

  const dataEvents = data.events as Events

  const result: Record<string, string> = {}

  for (const [ruleKey, enterpriseName] of Object.entries(rule.events)) {
    const eventValue = dataEvents[ruleKey]
    if (eventValue === undefined) continue

    result[enterpriseName as keyof typeof result] = eventValue
  }

  return { События: result }
}
