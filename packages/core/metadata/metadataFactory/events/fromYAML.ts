import { MetadataItemRule } from "../properties/types"

export const importEventsFromYAML = (params: {
  rule: MetadataItemRule
  yaml: { События?: Record<string, string> } | undefined
}): { events?: Record<string, string> } => {
  const { rule, yaml } = params
  const yamlEvents = yaml?.События

  if (!rule.events || !yamlEvents) {
    return {}
  }

  const result: Record<string, string> = {}

  for (const [ruleKey, enterpriseName] of Object.entries(rule.events)) {
    const eventValue = yamlEvents[enterpriseName as keyof typeof yamlEvents]
    if (eventValue === undefined) continue

    result[ruleKey] = eventValue
  }

  return { events: result }
}
