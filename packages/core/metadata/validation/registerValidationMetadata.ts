import { registerTypeRule } from "../ruleRuntime/property/typeRuleRegistry"
import { getRegisteredProjectSpecs } from "../project/projectSpecRegistry"
import { collectOwnerFactFromYAML } from "./dataPath/ownerFacts"

let registered = false
let ownerFactCollectorsRegistered = false

export function registerValidationMetadata(): void {
  if (registered) return
  registered = true
  registerOwnerFactCollectors()
}

export function registerOwnerFactCollectors(): void {
  if (ownerFactCollectorsRegistered) return
  ownerFactCollectorsRegistered = true
  const types = new Set<string>()
  for (const spec of getRegisteredProjectSpecs()) {
    for (const rule of Object.values(spec.rule.properties)) {
      if (rule.ownerFactRole === undefined || types.has(rule.type)) continue
      types.add(rule.type)
      registerTypeRule(rule.type, "collectLocalFactsFromYAML", collectOwnerFactFromYAML)
    }
  }
}
