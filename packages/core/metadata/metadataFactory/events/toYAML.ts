export const exportEventsToYAML = (
  rulesEvents: Record<string, string> | undefined,
  dataEvents: Record<string, string> | undefined
): { События?: Record<string, string> } => {
  if (!rulesEvents || !dataEvents) {
    return {}
  }

  const result: Record<string, string> = {}

  for (const [ruleKey, enterpriseName] of Object.entries(rulesEvents)) {
    const eventValue = dataEvents[ruleKey]
    if (eventValue === undefined) continue

    result[enterpriseName] = eventValue
  }

  return { События: result }
}
