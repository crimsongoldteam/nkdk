import type { MetadataDiagnostic } from "./types"
import type { DiagnosticBatchView } from "./binaryBatch"
import { encodeDiagnosticBatch, openDiagnosticBatch } from "./binaryBatch"

export interface MetadataDiagnosticCollection extends Iterable<MetadataDiagnostic> {
  readonly errors: number
  readonly warnings: number
  readonly count: number
  readonly released: boolean
  release(): void
}

export function createMetadataDiagnosticCollection(
  inputSources: readonly DiagnosticBatchView[],
): MetadataDiagnosticCollection {
  let sources = [...inputSources]
  const total = sources.reduce((sum, source) => sum + source.count, 0)
  if (total > 0xffff_ffff) throw new Error("Слишком много диагностик для одной коллекции")
  let entries: Uint32Array | undefined
  let released = false
  let errors = 0
  let warnings = 0
  let count = 0

  return {
    get errors() { assertAvailable(); ensureEntries(); return errors },
    get warnings() { assertAvailable(); ensureEntries(); return warnings },
    get count() { assertAvailable(); ensureEntries(); return count },
    get released() { return released },
    release() {
      if (released) return
      released = true
      sources = []
      entries = new Uint32Array()
    },
    [Symbol.iterator]() {
      assertAvailable()
      const orderedEntries = ensureEntries()
      let offset = 0
      return {
        next(): IteratorResult<MetadataDiagnostic> {
          assertAvailable()
          if (offset >= orderedEntries.length) return { done: true, value: undefined }
          const value = diagnosticAt(sources, orderedEntries, offset)
          offset += 2
          return { done: false, value }
        },
      }
    },
  }

  function assertAvailable(): void {
    if (released) throw new Error("Коллекция diagnostics освобождена")
  }

  function ensureEntries(): Uint32Array {
    if (entries !== undefined) return entries
    entries = buildSortedUniqueEntries(sources, total)
    count = entries.length / 2
    for (let offset = 0; offset < entries.length; offset += 2) {
      const diagnostic = diagnosticAt(sources, entries, offset)
      if (diagnostic.severity === "error") errors += 1
      else warnings += 1
    }
    return entries
  }
}

export function createMetadataDiagnosticCollectionFromDiagnostics(
  diagnostics: Iterable<MetadataDiagnostic>,
): MetadataDiagnosticCollection {
  return createMetadataDiagnosticCollection([
    openDiagnosticBatch(encodeDiagnosticBatch(diagnostics)),
  ])
}

function buildSortedUniqueEntries(
  sources: readonly DiagnosticBatchView[],
  total: number,
): Uint32Array {
  const pairs = new Uint32Array(total * 2)
  const order = new Uint32Array(total)
  let ordinal = 0
  sources.forEach((source, sourceIndex) => {
    for (let diagnosticIndex = 0; diagnosticIndex < source.count; diagnosticIndex += 1) {
      pairs[ordinal * 2] = sourceIndex
      pairs[ordinal * 2 + 1] = diagnosticIndex
      order[ordinal] = ordinal
      ordinal += 1
    }
  })
  order.sort((left, right) => compareDiagnostics(
    sources[pairs[left * 2]]!.diagnostic(pairs[left * 2 + 1]!),
    sources[pairs[right * 2]]!.diagnostic(pairs[right * 2 + 1]!),
  ))

  const unique = new Uint32Array(total * 2)
  let uniqueCount = 0
  let previous: MetadataDiagnostic | undefined
  for (const sortedOrdinal of order) {
    const sourceIndex = pairs[sortedOrdinal * 2]!
    const diagnosticIndex = pairs[sortedOrdinal * 2 + 1]!
    const current = sources[sourceIndex]!.diagnostic(diagnosticIndex)
    if (previous !== undefined && equalDiagnostics(previous, current)) continue
    unique[uniqueCount * 2] = sourceIndex
    unique[uniqueCount * 2 + 1] = diagnosticIndex
    uniqueCount += 1
    previous = current
  }
  return unique.slice(0, uniqueCount * 2)
}

function diagnosticAt(
  sources: readonly DiagnosticBatchView[],
  entries: Uint32Array,
  offset: number,
): MetadataDiagnostic {
  return sources[entries[offset]!]!.diagnostic(entries[offset + 1]!)
}

function compareDiagnostics(left: MetadataDiagnostic, right: MetadataDiagnostic): number {
  return left.filePath.localeCompare(right.filePath)
    || left.line - right.line
    || left.col - right.col
    || left.severity.localeCompare(right.severity)
    || left.source.localeCompare(right.source)
    || left.message.localeCompare(right.message)
    || (left.path ?? "").localeCompare(right.path ?? "")
    || (left.code ?? "").localeCompare(right.code ?? "")
    || (left.value ?? "").localeCompare(right.value ?? "")
}

function equalDiagnostics(left: MetadataDiagnostic, right: MetadataDiagnostic): boolean {
  return left.filePath === right.filePath
    && left.line === right.line
    && left.col === right.col
    && left.severity === right.severity
    && left.source === right.source
    && left.message === right.message
    && left.path === right.path
    && left.code === right.code
    && left.value === right.value
}
