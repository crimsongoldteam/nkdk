export interface XmlImportAttemptAdapter {
  begin(): unknown
  /** Проверяет checkpoint, не публикуя и не освобождая transaction data. */
  prepare?(checkpoint: unknown): void
  /** После commit checkpoint обязан оставаться доступным для rollback до release. */
  commit(checkpoint: unknown): void
  /** Освобождает transaction data после успешного commit всех участников. */
  release?(checkpoint: unknown): void
  rollback(checkpoint: unknown): void
}

export interface XmlImportAttempt {
  commit(): void
  rollback(): void
}

export interface XmlImportAttemptJournal {
  begin(): XmlImportAttempt
}

export type XmlImportAttemptPhase =
  | "begin"
  | "prepare"
  | "commit"
  | "rollback"
  | "release"

export class XmlImportAttemptInfrastructureError extends AggregateError {
  constructor(
    readonly phase: XmlImportAttemptPhase,
    cause: unknown,
    errors: readonly unknown[] = [cause],
  ) {
    super(
      errors,
      `Ошибка инфраструктуры XML-import attempt (${phase}): ${errorMessage(cause)}`,
      { cause },
    )
    this.name = "XmlImportAttemptInfrastructureError"
  }
}

const adapters = new WeakMap<object, XmlImportAttemptAdapter>()
const localIndexesBuffers = new WeakMap<
  LocalIndexesCollector,
  (sourceYamlPath: YamlPath) => XmlImportBufferedLocalIndexes
>()

export interface XmlImportBufferedLocalIndexes {
  readonly collector: LocalIndexesCollector
  flush(yamlPath: YamlPath): void
}

export function attachXmlImportAttemptAdapter(
  participant: object,
  adapter: XmlImportAttemptAdapter,
): void {
  if (adapters.has(participant)) {
    throw new Error("Для участника уже задан адаптер XML-import attempt")
  }
  adapters.set(participant, adapter)
}

export function attachXmlImportBufferedLocalIndexesFactory(
  participant: LocalIndexesCollector,
  factory: (sourceYamlPath: YamlPath) => XmlImportBufferedLocalIndexes,
): void {
  if (localIndexesBuffers.has(participant)) {
    throw new Error("Для участника уже задана фабрика buffered local indexes")
  }
  localIndexesBuffers.set(participant, factory)
}

export function createXmlImportBufferedLocalIndexes(
  participant: LocalIndexesCollector,
  sourceYamlPath: YamlPath,
): XmlImportBufferedLocalIndexes | undefined {
  return localIndexesBuffers.get(participant)?.([...sourceYamlPath])
}

export function createXmlImportAttemptJournal(
  participants: readonly (object | undefined)[],
): XmlImportAttemptJournal {
  const uniqueAdapters = [...new Set(
    participants.flatMap((participant) => {
      if (participant === undefined) return []
      const adapter = adapters.get(participant)
      return adapter === undefined ? [] : [adapter]
    }),
  )]

  return {
    begin() {
      const started: { adapter: XmlImportAttemptAdapter; checkpoint: unknown }[] = []
      try {
        for (const adapter of uniqueAdapters) {
          started.push({ adapter, checkpoint: adapter.begin() })
        }
      } catch (error) {
        throw rollbackAfterFailure("begin", started, error)
      }

      let active = true
      return {
        commit() {
          assertActive(active, "commit")
          try {
            prepareStarted(started)
          } catch (error) {
            throw new XmlImportAttemptInfrastructureError("prepare", error)
          }
          try {
            for (let index = started.length - 1; index >= 0; index -= 1) {
              const entry = started[index]!
              entry.adapter.commit(entry.checkpoint)
            }
          } catch (error) {
            active = false
            throw rollbackAfterFailure("commit", started, error)
          }
          active = false
          releaseStarted(started)
        },
        rollback() {
          assertActive(active, "rollback")
          active = false
          rollbackStarted(started)
        },
      }
    },
  }
}

export function arrayLengthXmlImportAttemptAdapter(
  arrays: readonly unknown[][],
): XmlImportAttemptAdapter {
  interface Checkpoint {
    readonly lengths: readonly number[]
    state: "active" | "committed"
  }
  const checkpoints: Checkpoint[] = []
  const current = (checkpoint: unknown, state?: Checkpoint["state"]): Checkpoint => {
    const expected = checkpoints.at(-1)
    if (expected === undefined || expected !== checkpoint || (state !== undefined && expected.state !== state)) {
      throw new Error("Нарушен порядок XML-import attempts array collector")
    }
    return expected
  }
  return {
    begin() {
      const checkpoint: Checkpoint = {
        lengths: arrays.map(({ length }) => length),
        state: "active",
      }
      checkpoints.push(checkpoint)
      return checkpoint
    },
    prepare(checkpoint) {
      current(checkpoint, "active")
    },
    commit(checkpoint) {
      current(checkpoint, "active").state = "committed"
    },
    release(checkpoint) {
      current(checkpoint, "committed")
      checkpoints.pop()
    },
    rollback(checkpoint) {
      const entry = current(checkpoint)
      arrays.forEach((array, index) => {
        array.length = entry.lengths[index] ?? 0
      })
      checkpoints.pop()
    },
  }
}

function prepareStarted(
  started: readonly { adapter: XmlImportAttemptAdapter; checkpoint: unknown }[],
): void {
  for (let index = started.length - 1; index >= 0; index -= 1) {
    const entry = started[index]!
    entry.adapter.prepare?.(entry.checkpoint)
  }
}

function releaseStarted(
  started: readonly { adapter: XmlImportAttemptAdapter; checkpoint: unknown }[],
): void {
  const errors = runBestEffort(
    started,
    (entry) => entry.adapter.release?.(entry.checkpoint),
  )
  if (errors.length > 0) {
    throw new XmlImportAttemptInfrastructureError("release", errors[0], errors)
  }
}

function rollbackStarted(
  started: readonly { adapter: XmlImportAttemptAdapter; checkpoint: unknown }[],
): void {
  const errors = runBestEffort(
    started,
    (entry) => entry.adapter.rollback(entry.checkpoint),
  )
  if (errors.length > 0) {
    throw new XmlImportAttemptInfrastructureError("rollback", errors[0], errors)
  }
}

function runBestEffort<Entry>(
  entries: readonly Entry[],
  run: (entry: Entry) => void,
): unknown[] {
  const errors: unknown[] = []
  for (let index = entries.length - 1; index >= 0; index -= 1) {
    try {
      run(entries[index]!)
    } catch (error) {
      errors.push(error)
    }
  }
  return errors
}

function rollbackAfterFailure(
  phase: "begin" | "commit",
  started: readonly { adapter: XmlImportAttemptAdapter; checkpoint: unknown }[],
  cause: unknown,
): XmlImportAttemptInfrastructureError {
  const rollbackErrors = runBestEffort(
    started,
    (entry) => entry.adapter.rollback(entry.checkpoint),
  )
  return new XmlImportAttemptInfrastructureError(
    phase,
    cause,
    [cause, ...rollbackErrors],
  )
}

function assertActive(active: boolean, phase: "commit" | "rollback"): void {
  if (active) return
  const cause = new Error("XML-import attempt уже завершена")
  throw new XmlImportAttemptInfrastructureError(phase, cause)
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
import type { YamlPath } from "../../diagnostics/types"
import type { LocalIndexesCollector } from "../property/localFacts"
