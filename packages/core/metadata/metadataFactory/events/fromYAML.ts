export const importEventsFromYAML = (
  rules: Record<string, string> | undefined,
  yamlEvents: Record<string, string> | undefined
): { events?: Record<string, string> } => {
  if (!rules || !yamlEvents) {
    return {}
  }

  const result: Record<string, string> = {}

  for (const [ruleKey, enterpriseName] of Object.entries(rules)) {
    const eventValue = yamlEvents[enterpriseName]
    if (eventValue === undefined) continue

    result[ruleKey] = eventValue
  }

  return { events: result }
}
