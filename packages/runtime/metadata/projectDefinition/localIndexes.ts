import type {
  LocalIndexesCollector,
  LocalMetadataEvent,
  LocalMetadataFactsWriter,
  LocalMetadataTargetFact,
  LocalYamlFact,
} from "../ruleRuntime/property/localFacts"
import { getTypeRule } from "../ruleRuntime/property/typeRuleRegistry"
import { attachXmlImportAttemptAdapter } from "../ruleRuntime/xmlAnomaly/attempt"

export type {
  LocalIndexes,
  LocalIndexesCollector,
  LocalMetadataEvent,
  LocalMetadataIndex,
  LocalMetadataTargetFact,
} from "../ruleRuntime/property/localFacts"

export function createLocalIndexesCollector(options?: { recordEvents?: boolean }): LocalIndexesCollector {
  const events: LocalMetadataEvent[] = []
  const ownerFacts: Record<string, unknown> = {}
  const metadataTargets: LocalMetadataTargetFact[] = []
  const ownerFactsUndo: { role: string; present: boolean; value: unknown }[] = []
  const checkpoints: {
    events: number
    metadataTargets: number
    ownerFactsUndo: number
  }[] = []

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
        if (checkpoints.length > 0) {
          ownerFactsUndo.push({
            role,
            present: Object.prototype.hasOwnProperty.call(ownerFacts, role),
            value: ownerFacts[role],
          })
        }
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

  const collector: LocalIndexesCollector = {
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
  attachXmlImportAttemptAdapter(collector, {
    begin() {
      const checkpoint = {
        events: events.length,
        metadataTargets: metadataTargets.length,
        ownerFactsUndo: ownerFactsUndo.length,
      }
      checkpoints.push(checkpoint)
      return checkpoint
    },
    commit(checkpoint) {
      closeCheckpoint(checkpoints, checkpoint)
      if (checkpoints.length === 0) ownerFactsUndo.length = 0
    },
    rollback(checkpoint) {
      const current = closeCheckpoint(checkpoints, checkpoint)
      events.length = current.events
      metadataTargets.length = current.metadataTargets
      for (let index = ownerFactsUndo.length - 1; index >= current.ownerFactsUndo; index -= 1) {
        const entry = ownerFactsUndo[index]!
        if (entry.present) ownerFacts[entry.role] = entry.value
        else delete ownerFacts[entry.role]
      }
      ownerFactsUndo.length = current.ownerFactsUndo
    },
  })
  return collector
}

function closeCheckpoint<Checkpoint extends object>(
  checkpoints: Checkpoint[],
  checkpoint: unknown,
): Checkpoint {
  const current = checkpoints.at(-1)
  if (current === undefined || current !== checkpoint) {
    throw new Error("Нарушен порядок XML-import attempts local facts")
  }
  checkpoints.pop()
  return current
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
