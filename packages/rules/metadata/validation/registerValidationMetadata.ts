import { registerTypeRule } from "../ruleRuntime/property/typeRuleRegistry"
import type { RegisteredProjectSpec } from "../projectDefinition/projectSpecContracts"
import { collectOwnerFactFromYAML } from "./dataPath/ownerFacts"
import { registerValidationProjectSpecs } from "./projectSpecs"

let registered = false
let ownerFactCollectorsRegistered = false

export function registerValidationMetadata(projectSpecs: readonly RegisteredProjectSpec[]): void {
  if (registered) return
  registered = true
  registerValidationProjectSpecs(projectSpecs)
  registerOwnerFactCollectors(projectSpecs)
}

export function registerOwnerFactCollectors(projectSpecs: readonly RegisteredProjectSpec[]): void {
  if (ownerFactCollectorsRegistered) return
  ownerFactCollectorsRegistered = true
  const types = new Set<string>()
  for (const spec of projectSpecs) {
    for (const rule of Object.values(spec.rule.properties)) {
      if (rule.ownerFactRole === undefined || types.has(rule.type)) continue
      types.add(rule.type)
      registerTypeRule(rule.type, "collectLocalFactsFromYAML", collectOwnerFactFromYAML)
    }
  }
}
