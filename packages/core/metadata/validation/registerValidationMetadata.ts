import { registerCoreMetadata } from "../register"
import { registerTypeRule } from "../orchestration/property/typeRuleRegistry"
import { collectOwnerFactFromYAML } from "./dataPath/ownerFacts"
import { configurationValidationProjectSpec, validationProjectSpecs } from "./projectSpecs"
import { registerFillValueValidation } from "../commonObjects/fillValue/register"

let registered = false
let ownerFactCollectorsRegistered = false

export function registerValidationMetadata(): void {
  if (registered) return
  registered = true
  registerCoreMetadata()
  registerFillValueValidation()
  registerOwnerFactCollectors()
}

export function registerOwnerFactCollectors(): void {
  if (ownerFactCollectorsRegistered) return
  ownerFactCollectorsRegistered = true
  const types = new Set<string>()
  for (const spec of [configurationValidationProjectSpec, ...validationProjectSpecs]) {
    for (const rule of Object.values(spec.rule.properties)) {
      if (rule.ownerFactRole === undefined || types.has(rule.type)) continue
      types.add(rule.type)
      registerTypeRule(rule.type, "collectLocalFactsFromYAML", collectOwnerFactFromYAML)
    }
  }
}
