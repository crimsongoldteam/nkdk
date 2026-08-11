import type { RegisteredProjectSpec } from "../projectDefinition/projectSpecContracts"
import { collectOwnerFactFromYAML } from "./dataPath/ownerFacts"
import { defineMetadataRules } from "../ruleRuntime/definition"
import { emptyMetadataRules } from "../ruleRuntime/definition/testSupport"
import { definePropertyTypeRule, propertyTypesFromContributions } from "../ruleRuntime/property/propertyRuleRegistrySet"

export function defineOwnerFactCollectorRules(projectSpecs: readonly RegisteredProjectSpec[]) {
  const types = new Set<string>()
  const contributions = []
  for (const spec of projectSpecs) {
    for (const rule of Object.values(spec.rule.properties)) {
      if (rule.ownerFactRole === undefined || types.has(rule.type)) continue
      types.add(rule.type)
      contributions.push(definePropertyTypeRule(rule.type, "collectLocalFactsFromYAML", collectOwnerFactFromYAML))
    }
  }
  return defineMetadataRules({
    ...emptyMetadataRules,
    propertyTypes: propertyTypesFromContributions(contributions),
  })
}
