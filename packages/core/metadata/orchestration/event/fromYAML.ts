import { MetadataItemTypeToYAML } from ".."
import { MetadataItemRule } from "../property/types"

export const importEventsFromYAML = <Rule extends MetadataItemRule>(params: {
  rule: Rule
  yaml: MetadataItemTypeToYAML<Rule["itemType"]> | undefined
}): { events?: Record<string, string> } => {
  const { rule, yaml } = params

  if (!yaml || !("События" in yaml)) {
    return {}
  }

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
