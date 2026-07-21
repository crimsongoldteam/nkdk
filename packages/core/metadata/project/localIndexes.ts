import type { DeferredImportedYamlValue, LocalYamlFact } from "../orchestration/property/importYamlTypes"
import { getTypeRule } from "../orchestration/property/typeRuleRegistry"

export type LocalMetadataIndex = Record<never, never>
export type LocalDependencyIndex = DeferredImportedYamlValue[]

export interface LocalIndexes {
  metadata: LocalMetadataIndex
  dependencies: LocalDependencyIndex
}

export interface LocalIndexesCollector {
  acceptProperty(fact: LocalYamlFact): void
  completeValue(fact: LocalYamlFact): void
  finish(): LocalIndexes
}

export function createLocalIndexesCollector(): LocalIndexesCollector {
  const dependencies: LocalDependencyIndex = []

  const acceptProperty = (fact: LocalYamlFact): void => {
    if (getTypeRule(fact.rule.type, "finalizeImportedYAML") === undefined) return
    dependencies.push({ yamlPath: fact.yamlPath, rulePath: fact.rulePath })
  }

  return {
    acceptProperty,
    completeValue: acceptProperty,
    finish: () => ({ metadata: {}, dependencies }),
  }
}
