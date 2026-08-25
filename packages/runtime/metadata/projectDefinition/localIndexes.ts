import type {
  LocalIndexesCollector,
  LocalMetadataEvent,
  LocalMetadataFactsWriter,
  LocalMetadataTargetFact,
  LocalYamlFact,
} from "../ruleRuntime/property/localFacts"
import { getTypeRule } from "../ruleRuntime/property/typeRuleRegistry"
import {
  attachXmlImportAttemptAdapter,
  attachXmlImportBufferedLocalIndexesFactory,
} from "../ruleRuntime/xmlAnomaly/attempt"

export type {
  LocalIndexes,
  LocalIndexesCollector,
  LocalMetadataEvent,
  LocalMetadataIndex,
  LocalMetadataTargetFact,
} from "../ruleRuntime/property/localFacts"

interface LocalIndexesStorage {
  readonly events: LocalMetadataEvent[]
  readonly metadataTargets: LocalMetadataTargetFact[]
  readonly ownerFactWrites: { role: string; value: unknown }[]
}

const collectorStorage = new WeakMap<LocalIndexesCollector, LocalIndexesStorage>()

export function createLocalIndexesCollector(options?: { recordEvents?: boolean }): LocalIndexesCollector {
  const events: LocalMetadataEvent[] = []
  const metadataTargets: LocalMetadataTargetFact[] = []
  const ownerFactWrites: { role: string; value: unknown }[] = []
  const checkpoints: {
    events: number
    metadataTargets: number
    ownerFactWrites: number
    state: "active" | "committed"
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
        ownerFactWrites.push({ role, value })
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
    finish: () => {
      const ownerFacts = Object.fromEntries(
        ownerFactWrites.map(({ role, value }) => [role, value]),
      )
      return {
        metadata: {
          events,
          ...(Object.keys(ownerFacts).length === 0 ? {} : { ownerFacts }),
          ...(metadataTargets.length === 0 ? {} : { metadataTargets }),
        },
      }
    },
  }
  const storage = { events, metadataTargets, ownerFactWrites }
  collectorStorage.set(collector, storage)
  attachXmlImportAttemptAdapter(collector, {
    begin() {
      const checkpoint = {
        events: events.length,
        metadataTargets: metadataTargets.length,
        ownerFactWrites: ownerFactWrites.length,
        state: "active" as const,
      }
      checkpoints.push(checkpoint)
      return checkpoint
    },
    prepare(checkpoint) {
      currentCheckpoint(checkpoints, checkpoint, "active")
    },
    commit(checkpoint) {
      currentCheckpoint(checkpoints, checkpoint, "active").state = "committed"
    },
    release(checkpoint) {
      currentCheckpoint(checkpoints, checkpoint, "committed")
      checkpoints.pop()
    },
    rollback(checkpoint) {
      const current = currentCheckpoint(checkpoints, checkpoint)
      events.length = current.events
      metadataTargets.length = current.metadataTargets
      ownerFactWrites.length = current.ownerFactWrites
      checkpoints.pop()
    },
  })
  attachXmlImportBufferedLocalIndexesFactory(collector, (sourceYamlPath) => {
    const buffered = createLocalIndexesCollector(options)
    const bufferedStorage = collectorStorage.get(buffered)
    if (bufferedStorage === undefined) throw new Error("Не найден storage buffered local indexes")
    return {
      collector: buffered,
      flush(yamlPath) {
        appendBufferedLocalIndexes({
          source: bufferedStorage,
          target: storage,
          sourceYamlPath,
          yamlPath,
        })
      },
    }
  })
  return collector
}

function appendBufferedLocalIndexes(params: {
  source: LocalIndexesStorage
  target: LocalIndexesStorage
  sourceYamlPath: readonly (string | number)[]
  yamlPath: readonly (string | number)[]
}): void {
  const remap = (path: readonly (string | number)[]): (string | number)[] => [
    ...params.yamlPath,
    ...path.slice(params.sourceYamlPath.length),
  ]
  for (const event of params.source.events) {
    params.target.events.push({ ...event, yamlPath: remap(event.yamlPath) })
  }
  for (const target of params.source.metadataTargets) {
    params.target.metadataTargets.push({ ...target, yamlPath: remap(target.yamlPath) })
  }
  params.target.ownerFactWrites.push(...params.source.ownerFactWrites)
}

function currentCheckpoint<Checkpoint extends { state: "active" | "committed" }>(
  checkpoints: Checkpoint[],
  checkpoint: unknown,
  state?: Checkpoint["state"],
): Checkpoint {
  const current = checkpoints.at(-1)
  if (current === undefined || current !== checkpoint || (state !== undefined && current.state !== state)) {
    throw new Error("Нарушен порядок XML-import attempts local facts")
  }
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
