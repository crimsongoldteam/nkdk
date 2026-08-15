import {
  currentPropertyRuleRegistrySet,
  type PropertyRule,
  type PropertyRuleExecution,
} from "@nkdk/runtime/rule-kit"

export function isTransportedBrokenPropertyScalar(params: {
  execution?: PropertyRuleExecution
  rule: PropertyRule
  yamlValue: unknown
  tagged: boolean
}): boolean {
  if (!params.tagged) return false
  const registry = params.execution ?? currentPropertyRuleRegistrySet<PropertyRuleExecution>()
  return registry?.isTransportedBrokenXMLReference({
    rule: params.rule,
    yamlValue: params.yamlValue,
    location: { kind: "value", path: [] },
    isTagged: (location) => location.kind === "value" && location.path.length === 0,
  }) ?? false
}
