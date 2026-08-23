export interface XmlImportAttemptAdapter {
  begin(): unknown
  commit(checkpoint: unknown): void
  rollback(checkpoint: unknown): void
}

export interface XmlImportAttempt {
  commit(): void
  rollback(): void
}

export interface XmlImportAttemptJournal {
  begin(): XmlImportAttempt
}

const adapters = new WeakMap<object, XmlImportAttemptAdapter>()

export function attachXmlImportAttemptAdapter(
  participant: object,
  adapter: XmlImportAttemptAdapter,
): void {
  if (adapters.has(participant)) {
    throw new Error("Для участника уже задан адаптер XML-import attempt")
  }
  adapters.set(participant, adapter)
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
        rollbackStarted(started)
        throw error
      }

      let active = true
      return {
        commit() {
          assertActive(active)
          for (let index = started.length - 1; index >= 0; index -= 1) {
            const entry = started[index]!
            entry.adapter.commit(entry.checkpoint)
          }
          active = false
        },
        rollback() {
          assertActive(active)
          rollbackStarted(started)
          active = false
        },
      }
    },
  }
}

export function arrayLengthXmlImportAttemptAdapter(
  arrays: readonly unknown[][],
): XmlImportAttemptAdapter {
  return {
    begin: () => arrays.map(({ length }) => length),
    commit: () => undefined,
    rollback(checkpoint) {
      const lengths = checkpoint as readonly number[]
      arrays.forEach((array, index) => {
        array.length = lengths[index] ?? 0
      })
    },
  }
}

function rollbackStarted(
  started: readonly { adapter: XmlImportAttemptAdapter; checkpoint: unknown }[],
): void {
  for (let index = started.length - 1; index >= 0; index -= 1) {
    const entry = started[index]!
    entry.adapter.rollback(entry.checkpoint)
  }
}

function assertActive(active: boolean): void {
  if (!active) throw new Error("XML-import attempt уже завершена")
}
