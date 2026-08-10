import type {
  LocalIndexesCollector,
  LocalMetadataEvent,
  LocalMetadataFactsWriter,
  LocalMetadataTargetFact,
  LocalYamlFact,
} from "@nkdk/runtime/rule-kit"
import { getTypeRule } from "../ruleRuntime/property/typeRuleRegistry"

export type {
  LocalIndexes,
  LocalIndexesCollector,
  LocalMetadataEvent,
  LocalMetadataIndex,
  LocalMetadataTargetFact,
} from "@nkdk/runtime/rule-kit"

export function createLocalIndexesCollector(options?: { recordEvents?: boolean }): LocalIndexesCollector {
  const events: LocalMetadataEvent[] = []
  const ownerFacts: Record<string, unknown> = {}
  const metadataTargets: LocalMetadataTargetFact[] = []

  const recordEvent = (kind: "property" | "complete", fact: LocalYamlFact): void => {
    if (options?.recordEvents === false) return
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
    let metadataTargetValuesHandled = false
    const writer: LocalMetadataFactsWriter = {
      setOwnerFact(role, value) {
        ownerFacts[role] = value
      },
      setMetadataTargetValues(values) {
        metadataTargetValuesHandled = true
        const constraint = fact.rule.metadataTarget
        if (constraint === undefined) return
        for (const { value, yamlPath } of values) {
          appendMetadataTargetFact(metadataTargets, fact, constraint, value, yamlPath)
        }
      },
    }
    getTypeRule(fact.rule.type, "collectLocalFactsFromYAML")?.({ fact, writer })
    if (!metadataTargetValuesHandled) collectDefaultMetadataTargetFacts(metadataTargets, fact)
  }

  return {
    acceptItem(fact) {
      if (options?.recordEvents === false) return
      events.push({
        kind: "item",
        itemType: fact.itemType,
        ...(fact.name === undefined ? {} : { name: fact.name }),
        yamlPath: [...fact.yamlPath],
        rulePath: fact.rulePath.map((segment) => ({ ...segment })),
      })
    },
    acceptProperty,
    completeValue: (fact) => recordEvent("complete", fact),
    finish: () => ({
      metadata: {
        events,
        ...(Object.keys(ownerFacts).length === 0 ? {} : { ownerFacts }),
        ...(metadataTargets.length === 0 ? {} : { metadataTargets }),
      },
    }),
  }
}

function collectDefaultMetadataTargetFacts(target: LocalMetadataTargetFact[], fact: LocalYamlFact): void {
  const constraint = fact.rule.metadataTarget
  if (constraint === undefined) return

  collectStringValues(fact.value, fact.yamlPath, (value, yamlPath) =>
    appendMetadataTargetFact(target, fact, constraint, value, yamlPath)
  )
}

function collectStringValues(
  value: unknown,
  yamlPath: readonly (string | number)[],
  accept: (value: string, yamlPath: readonly (string | number)[]) => void
): void {
  if (typeof value === "string") {
    accept(value, yamlPath)
    return
  }
  if (!Array.isArray(value)) return
  value.forEach((item, index) => collectStringValues(item, [...yamlPath, index], accept))
}

function appendMetadataTargetFact(
  target: LocalMetadataTargetFact[],
  fact: LocalYamlFact,
  constraint: LocalMetadataTargetFact["constraint"],
  value: string,
  yamlPath: readonly (string | number)[]
): void {
  target.push({
    yamlPath: [...yamlPath],
    value,
    constraint,
    ...(fact.metadataTargetOwner === undefined ? {} : { owner: { ...fact.metadataTargetOwner } }),
    rulePath: fact.rulePath.map((segment) => ({ ...segment })),
  })
}
