import type { DeferredImportedYamlValue, LocalYamlFact } from "../orchestration/property/importYamlTypes"
import { getTypeRule } from "../orchestration/property/typeRuleRegistry"

export interface LocalMetadataEvent {
  kind: "property" | "complete"
  yamlPath: readonly (string | number)[]
  rulePath: LocalYamlFact["rulePath"]
  propertyType: string
  source?: LocalYamlFact["source"]
}

export interface LocalMetadataIndex {
  events: LocalMetadataEvent[]
}
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
  const events: LocalMetadataEvent[] = []
  const dependencies: LocalDependencyIndex = []

  const recordEvent = (kind: LocalMetadataEvent["kind"], fact: LocalYamlFact): void => {
    events.push({
      kind,
      yamlPath: [...fact.yamlPath],
      rulePath: fact.rulePath.map((segment) => ({ ...segment })),
      propertyType: fact.rule.type,
      ...(fact.source === undefined ? {} : { source: { ...fact.source } }),
    })
  }

  const acceptProperty = (fact: LocalYamlFact): void => {
    recordEvent("property", fact)
    if (getTypeRule(fact.rule.type, "finalizeImportedYAML") === undefined) return
    dependencies.push({ yamlPath: fact.yamlPath, rulePath: fact.rulePath })
  }

  return {
    acceptProperty,
    completeValue: (fact) => recordEvent("complete", fact),
    finish: () => ({ metadata: { events }, dependencies }),
  }
}
