import os from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import Piscina from "piscina"
import { mergeConfigurationIndexFragments } from "../configurationIndex/fragment"
import type { MergedConfigurationSnapshotFragments } from "../configurationIndex/types"
import type { SharedConfigurationIndexSnapshot } from "../configurationIndex/sharedSnapshot"
import type { ConfigurationContext } from "../context/types"
import type { ProjectStateReadToken } from "../projectState"
import type { MetadataWorkerOperation } from "../workerPool/types"
import { sourceWorkerExecArgv } from "../sourceWorkerRuntime"
import type { FullXmlSyncWorkerProfileRuntime } from "./componentProfile"
import type { FullXmlSyncSharedCompositionSnapshot } from "./sharedMetadata"
import type {
  FullXmlSyncAssignment,
  FullXmlSyncDiagnostic,
  FullXmlSyncExecutionResult,
  FullXmlSyncExpectedOutput,
  FullXmlSyncWorkerCommand,
  FullXmlSyncWorkerCommandResult,
  FullXmlSyncWrittenFile,
} from "./types"
import { aggregateCleanupFailures, failureMessage, flattenFailures } from "./cleanupFailure"

export interface FullXmlSyncWorkerInitialization {
  readonly componentPath: string
  readonly componentDir: string
  readonly outputDir: string
  readonly context: ConfigurationContext
  readonly profile: FullXmlSyncWorkerProfileRuntime
  readonly composition: FullXmlSyncSharedCompositionSnapshot
  readonly targetIndex: SharedConfigurationIndexSnapshot
  readonly projectStateReadTokens?: readonly ProjectStateReadToken[]
}

export interface FullXmlSyncExecutionPoolResult {
  readonly diagnostics: FullXmlSyncDiagnostic[]
  readonly warnings: FullXmlSyncDiagnostic[]
  readonly writtenFiles: FullXmlSyncWrittenFile[]
  readonly expectedOutputs: FullXmlSyncExpectedOutput[]
  readonly fragmentData: MergedConfigurationSnapshotFragments
}

export interface FullXmlSyncWorkerPool {
  initialize(params: FullXmlSyncWorkerInitialization): Promise<void>
  execute(assignments: readonly FullXmlSyncAssignment[]): Promise<FullXmlSyncExecutionPoolResult>
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
  let fatalError: unknown
  let destroyPromise: Promise<void> | undefined

  return {
    async initialize(initializeParams) {
      assertPhase(phase, "new", "Full XML sync worker pool уже инициализирован")
      initialization = initializeParams
      phase = "initialized"
    },

    async execute(assignments) {
      assertUsable(phase, fatalError)
      assertPhase(phase, "initialized", "Выполнение full XML sync уже было запущено")
      if (initialization === undefined) {
        throw new Error("Full XML sync worker pool не инициализирован")
      }
      phase = "executing"
      const partitions = partitionRoundRobin(assignments, concurrency).filter((partition) => partition.length > 0)
      const initialized = initialization
      const { projectStateReadTokens = [], ...workerInitialization } = initialized
      const results = await Promise.all(
        partitions.map(async (partition, workerIndex): Promise<FullXmlSyncExecutionResult> => {
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
          const response = await runCommand(workerIndex, {
            kind: "execute",
            assignments: partition,
          })
          if (response?.kind !== "executionResult") {
            return failWorker(new Error("Worker вернул неожиданный результат execute"))
          }
          return response
        })
      )
      phase = "done"
      return {
        diagnostics: results.flatMap(({ diagnostics }) => diagnostics),
        warnings: results.flatMap(({ warnings }) => warnings),
        writtenFiles: results.flatMap(({ writtenFiles }) => writtenFiles),
        expectedOutputs: results.flatMap(({ expectedOutputs }) => expectedOutputs),
        fragmentData: mergeConfigurationIndexFragments(results.map(({ fragmentBuffer }) => fragmentBuffer)),
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
