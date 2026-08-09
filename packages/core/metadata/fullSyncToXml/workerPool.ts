import os from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import Piscina from "piscina"
import { mergeConfigurationIndexFragments } from "../configurationIndex/fragment"
import type { MergedConfigurationSnapshotFragments } from "../configurationIndex/types"
import {
  createConfigurationIndexReader,
  type AssignmentScopedConfigurationIndexReader,
  type SharedConfigurationIndexSnapshot,
} from "../configurationIndex/sharedSnapshot"
import type { ConfigurationContext } from "../context/types"
import type { ProjectStateReadToken } from "../projectState"
import type { MetadataWorkerOperation } from "../workerPool/types"
import { sourceWorkerExecArgv } from "../sourceWorkerRuntime"
import type { FullXmlSyncWorkerProfileRuntime } from "./componentProfile"
import type { FullXmlSyncSharedCompositionSnapshot } from "./sharedMetadata"
import type {
  FullXmlSyncAssignment,
  FullXmlSyncDiagnostic,
  FullXmlSyncExecutionAssignment,
  FullXmlSyncExpectedOutput,
  FullXmlSyncGeneratedDocument,
  FullXmlSyncOutputTarget,
  FullXmlSyncWorkerCommand,
  FullXmlSyncWorkerCommandResult,
  FullXmlSyncWrittenFile,
} from "./types"
import { aggregateCleanupFailures, failureMessage, flattenFailures } from "./cleanupFailure"
import { openFullXmlSyncBinaryResult, type FullXmlSyncBinaryBatchView } from "./binaryResult"

export interface FullXmlSyncWorkerInitialization {
  readonly componentPath: string
  readonly componentDir: string
  readonly outputTarget: FullXmlSyncOutputTarget
  readonly context: ConfigurationContext
  readonly profile: FullXmlSyncWorkerProfileRuntime
  readonly composition: FullXmlSyncSharedCompositionSnapshot
  readonly targetIndex: SharedConfigurationIndexSnapshot
  readonly projectStateReadTokens?: readonly ProjectStateReadToken[]
}

export interface FullXmlSyncExecutionPoolResult {
  readonly diagnostics: FullXmlSyncDiagnosticCollection
  readonly warnings: FullXmlSyncDiagnosticCollection
  readonly writtenFiles: FullXmlSyncFileCollection<FullXmlSyncWrittenFile>
  readonly expectedOutputs: FullXmlSyncFileCollection<FullXmlSyncExpectedOutput>
  readonly fragmentData: MergedConfigurationSnapshotFragments
}

export type FullXmlSyncExecutionSummary = FullXmlSyncExecutionPoolResult

export interface FullXmlSyncExecutionBatch {
  readonly generatedDocuments: readonly FullXmlSyncGeneratedDocument[]
}

export interface FullXmlSyncExecutionOptions {
  readonly onBatch?: (batch: FullXmlSyncExecutionBatch) => Promise<void>
  readonly maxBufferedBatches?: number
}

export interface FullXmlSyncDiagnosticCollection extends Iterable<FullXmlSyncDiagnostic> {
  readonly count: number
  readonly errors: number
  readonly warnings: number
  readonly released: boolean
  release(): void
}

export interface FullXmlSyncFileCollection<T> extends Iterable<T> {
  readonly count: number
  readonly released: boolean
  release(): void
}

export function createFullXmlSyncDiagnosticCollectionFromDiagnostics(
  diagnostics: readonly FullXmlSyncDiagnostic[],
): FullXmlSyncDiagnosticCollection {
  return createDiagnosticCollection([{
    count: diagnostics.length,
    diagnostic(index) {
      const value = diagnostics[index]
      if (value === undefined) throw new RangeError(`Неизвестная diagnostic sync: ${index}`)
      return value
    },
  }])
}

export function createFullXmlSyncFileCollectionFromFiles<T>(files: readonly T[]): FullXmlSyncFileCollection<T> {
  return createFileCollection([{
    count: files.length,
    file(index) {
      const value = files[index]
      if (value === undefined) throw new RangeError(`Неизвестный файл sync: ${index}`)
      return value
    },
  }])
}

export interface FullXmlSyncWorkerPool {
  initialize(params: FullXmlSyncWorkerInitialization): Promise<void>
  execute(
    assignments: readonly FullXmlSyncAssignment[],
    options?: FullXmlSyncExecutionOptions,
  ): Promise<FullXmlSyncExecutionSummary>
  close(): Promise<void>
}

export interface FullXmlSyncWorkerThreadPool {
  run(task: FullXmlSyncWorkerCommand): Promise<unknown>
  destroy(): Promise<void>
}

type PoolPhase = "new" | "initialized" | "executing" | "done" | "crashed" | "closed"

export function createFullXmlSyncWorkerPool(params: {
  concurrency?: number
  createWorkerPool?: () => FullXmlSyncWorkerThreadPool
  operation?: MetadataWorkerOperation
}): FullXmlSyncWorkerPool {
  const concurrency = normalizeFullXmlSyncConcurrency(params.concurrency)
  const pools = new Map<number, FullXmlSyncWorkerThreadPool>()
  const createPool = params.createWorkerPool ?? createPiscinaWorkerPool
  let phase: PoolPhase = "new"
  let initialization: FullXmlSyncWorkerInitialization | undefined
  let targetIndexReader: AssignmentScopedConfigurationIndexReader | undefined
  let fatalError: unknown
  let destroyPromise: Promise<void> | undefined

  return {
    async initialize(initializeParams) {
      assertPhase(phase, "new", "Full XML sync worker pool уже инициализирован")
      initialization = initializeParams
      targetIndexReader = createConfigurationIndexReader(initializeParams.targetIndex)
      phase = "initialized"
    },

    async execute(assignments, options = {}) {
      assertUsable(phase, fatalError)
      assertPhase(phase, "initialized", "Выполнение full XML sync уже было запущено")
      if (initialization === undefined) {
        throw new Error("Full XML sync worker pool не инициализирован")
      }
      const maxBufferedBatches = normalizeMaxBufferedBatches(options.maxBufferedBatches, concurrency)
      phase = "executing"
      const batchSlots = createAsyncSlots(maxBufferedBatches)
      let consumerTail = Promise.resolve()
      const indexReader = targetIndexReader
      if (indexReader === undefined) {
        throw new Error("Full XML sync worker pool не получил target index")
      }
      const executableAssignments = assignments.map((assignment): FullXmlSyncExecutionAssignment => ({
        ...assignment,
        configurationIndexEntityRange: indexReader.entityRange(assignment.sourceProjectPath),
      }))
      const partitions = partitionRoundRobin(executableAssignments, concurrency)
        .filter((partition) => partition.length > 0)
      const initialized = initialization
      const { projectStateReadTokens = [], ...workerInitialization } = initialized
      const results = await Promise.all(
        partitions.map(async (partition, workerIndex): Promise<FullXmlSyncBinaryBatchView[]> => {
          const initializeResponse = await runCommand(workerIndex, {
            kind: "initialize",
            workerIndex,
            ...workerInitialization,
            ...(params.operation === undefined
              ? { projectStateReadToken: requireWorkerReadToken(projectStateReadTokens, workerIndex) }
              : {}),
          })
          if (initializeResponse !== undefined) {
            return failWorker(new Error("Worker вернул неожиданный результат initialize"))
          }
          const batches: FullXmlSyncBinaryBatchView[] = []
          for (let offset = 0; offset < partition.length; offset += 256) {
            const releaseSlot = await batchSlots.acquire()
            let batch: FullXmlSyncBinaryBatchView | undefined
            try {
              const response = await runCommand(workerIndex, {
                kind: "executeBatch",
                assignments: partition.slice(offset, offset + 256),
              })
              batch = openFullXmlSyncBinaryResult(response)
              batches.push(batch)
              const documents = Array.from(
                { length: batch.generatedDocuments.count },
                (_unused, index) => batch!.generatedDocuments.document(index),
              )
              if (documents.length > 0 && options.onBatch === undefined) {
                throw new Error("Получены XML-документы без обработчика пачки")
              }
              const consume = consumerTail.then(() => options.onBatch?.({ generatedDocuments: documents }))
              consumerTail = consume.then(() => undefined, () => undefined)
              await consume
            } catch (caught) {
              return failWorker(caught)
            } finally {
              batch?.generatedDocuments.release()
              releaseSlot()
            }
          }
          const finishResponse = await runCommand(workerIndex, { kind: "finishExecution" })
          if (finishResponse !== undefined) {
            return failWorker(new Error("Worker вернул неожиданный результат finishExecution"))
          }
          return batches
        })
      )
      const batches = results.flatMap((value) => value)
      phase = "done"
      return {
        diagnostics: createDiagnosticCollection(batches.map(({ diagnostics }) => diagnostics)),
        warnings: createDiagnosticCollection(batches.map(({ warnings }) => warnings)),
        writtenFiles: createFileCollection(batches.map(({ writtenFiles }) => writtenFiles)),
        expectedOutputs: createFileCollection(batches.map(({ expectedOutputs }) => expectedOutputs)),
        fragmentData: mergeConfigurationIndexFragments(batches.map(({ fragmentBuffer }) => fragmentBuffer)),
      }
    },

    async close() {
      if (phase === "closed") return
      if (phase === "crashed") {
        try {
          await destroyAllWorkers()
        } catch {
          // Исходная ошибка worker важнее ошибки остановки уже аварийного пула.
        }
        await params.operation?.finish("failure")
        phase = "closed"
        return
      }
      try {
        await destroyAllWorkers()
      } finally {
        await params.operation?.finish("success")
        phase = "closed"
      }
    },
  }

  async function runCommand(
    workerIndex: number,
    command: FullXmlSyncWorkerCommand
  ): Promise<FullXmlSyncWorkerCommandResult> {
    try {
      return (await getOrCreatePool(workerIndex).run(command)) as FullXmlSyncWorkerCommandResult
    } catch (caught) {
      return failWorker(caught)
    }
  }

  async function failWorker(caught: unknown): Promise<never> {
    if (fatalError === undefined) {
      fatalError = caught
      phase = "crashed"
      try {
        await destroyAllWorkers()
      } catch (cleanupFailure) {
        fatalError = aggregateCleanupFailures(caught, cleanupFailure)
      }
    } else {
      await destroyPromise?.catch(() => undefined)
    }
    throw fatalError
  }

  function getOrCreatePool(workerIndex: number): FullXmlSyncWorkerThreadPool {
    let pool = pools.get(workerIndex)
    if (pool === undefined) {
      pool = params.operation === undefined
        ? createPool()
        : createOperationWorkerPool(params.operation, workerIndex)
      pools.set(workerIndex, pool)
    }
    return pool
  }

  function destroyAllWorkers(): Promise<void> {
    destroyPromise ??= Promise.all([...pools.values()].map(cleanupWorker)).then((failures) => {
      const flattened = failures.flatMap((failure) => failure)
      if (flattened.length === 1) throw flattened[0]
      if (flattened.length > 1) throw new AggregateError(flattened, failureMessage(flattened[0]))
    })
    return destroyPromise
  }

  async function cleanupWorker(pool: FullXmlSyncWorkerThreadPool): Promise<unknown[]> {
    const failures: unknown[] = []
    try {
      await pool.run({ kind: "dispose" })
    } catch (caught) {
      failures.push(...flattenFailures(caught))
    }
    try {
      await pool.destroy()
    } catch (caught) {
      failures.push(...flattenFailures(caught))
    }
    return failures
  }
}

function normalizeMaxBufferedBatches(value: number | undefined, defaultValue: number): number {
  if (value === undefined) return defaultValue
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new Error("maxBufferedBatches должен быть положительным целым числом")
  }
  return value
}

function createAsyncSlots(capacity: number): { acquire(): Promise<() => void> } {
  let available = capacity
  const waiters: Array<(release: () => void) => void> = []
  return {
    acquire() {
      if (available > 0) {
        available -= 1
        return Promise.resolve(release)
      }
      return new Promise((resolve) => waiters.push(resolve))
    },
  }

  function release(): void {
    const waiter = waiters.shift()
    if (waiter !== undefined) waiter(release)
    else available += 1
  }
}

function createDiagnosticCollection(
  inputViews: readonly FullXmlSyncBinaryBatchView["diagnostics"][],
): FullXmlSyncDiagnosticCollection {
  const values = createViewCollection(inputViews, "diagnostics sync", (view, index) => view.diagnostic(index))
  let counts: { errors: number; warnings: number } | undefined
  return {
    get count() { return values.count },
    get errors() { return diagnosticCounts().errors },
    get warnings() { return diagnosticCounts().warnings },
    get released() { return values.released },
    release() { values.release() },
    [Symbol.iterator]() { return values[Symbol.iterator]() },
  }

  function diagnosticCounts(): { errors: number; warnings: number } {
    if (counts !== undefined) return counts
    counts = { errors: 0, warnings: 0 }
    for (const diagnostic of values) counts[`${diagnostic.severity}s`] += 1
    return counts
  }
}

function createFileCollection<T>(
  inputViews: readonly { readonly count: number; file(index: number): T }[],
): FullXmlSyncFileCollection<T> {
  return createViewCollection(inputViews, "файлов sync", (view, index) => view.file(index))
}

function createViewCollection<TView extends { readonly count: number }, T>(
  inputViews: readonly TView[],
  name: string,
  read: (view: TView, index: number) => T,
): FullXmlSyncFileCollection<T> {
  let views = [...inputViews]
  let released = false
  const count = views.reduce((sum, view) => sum + view.count, 0)
  return {
    get count() { assertAvailable(); return count },
    get released() { return released },
    release() { released = true; views = [] },
    *[Symbol.iterator]() {
      assertAvailable()
      for (const view of views) {
        for (let index = 0; index < view.count; index += 1) yield read(view, index)
      }
    },
  }

  function assertAvailable(): void {
    if (released) throw new Error(`Коллекция ${name} освобождена`)
  }
}

function createOperationWorkerPool(
  operation: MetadataWorkerOperation,
  workerIndex: number,
): FullXmlSyncWorkerThreadPool {
  return {
    async run(command) {
      const response = await operation.run(workerIndex, { kind: "fullSync", command })
      if (response.kind !== "fullSyncResult") {
        throw new Error("Универсальный worker вернул неожиданный результат fullSync")
      }
      return response.result
    },
    async destroy() {},
  }
}

function requireWorkerReadToken(tokens: readonly ProjectStateReadToken[], workerIndex: number): ProjectStateReadToken {
  const token = tokens[workerIndex]
  if (token === undefined) throw new Error(`Не подготовлен read token для worker ${workerIndex}`)
  return token
}

export function normalizeFullXmlSyncConcurrency(value: number | undefined): number {
  if (value !== undefined) {
    if (!Number.isSafeInteger(value) || value < 1) {
      throw new Error("Степень параллелизма full XML sync должна быть положительным целым числом")
    }
    return value
  }
  return Math.max(1, Math.min(4, os.availableParallelism() - 1))
}

function createPiscinaWorkerPool(): Piscina {
  const currentFile = fileURLToPath(import.meta.url)
  const workerFile = currentFile.endsWith(".ts")
    ? join(dirname(currentFile), "worker.ts")
    : join(dirname(currentFile), "fullSyncToXmlWorker.js")
  const execArgv = currentFile.endsWith(".ts") ? sourceWorkerExecArgv() : []
  return new Piscina({
    filename: workerFile,
    minThreads: 1,
    maxThreads: 1,
    execArgv,
  })
}

function partitionRoundRobin<T>(items: readonly T[], count: number): T[][] {
  const result = Array.from({ length: count }, () => [] as T[])
  items.forEach((item, index) => result[index % count]?.push(item))
  return result
}

function assertUsable(phase: PoolPhase, fatalError: unknown): void {
  if (phase === "crashed") throw fatalError
  if (phase === "closed") throw new Error("Full XML sync worker pool закрыт")
}

function assertPhase(actual: PoolPhase, expected: PoolPhase, message: string): void {
  if (actual !== expected) throw new Error(message)
}
