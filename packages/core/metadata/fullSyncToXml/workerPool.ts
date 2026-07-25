import os from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import Piscina from "piscina"
import { mergeConfigurationIndexFragments } from "../configurationIndex/fragment"
import type { ConfigurationContext } from "../context/types"
import { sourceWorkerExecArgv } from "../sourceWorkerRuntime"
import type {
  FullXmlSyncAssignment,
  FullXmlSyncDiagnostic,
  FullXmlSyncFirstPassResult,
  FullXmlSyncOwnerFacts,
  FullXmlSyncSecondPassResult,
  FullXmlSyncWorkerCommand,
  FullXmlSyncWorkerCommandResult,
  FullXmlSyncWrittenFile,
} from "./types"
import type { ConfigurationProjectFile } from "../configurationIndex/types"
import type { ConfigurationIndexData } from "../configurationIndex/types"
import type { SharedConfigurationIndexSnapshot } from "../configurationIndex/sharedSnapshot"
import type { FullXmlSyncSharedCompositionSnapshot, FullXmlSyncSharedMetadata } from "./sharedMetadata"

export interface FullXmlSyncWorkerPool {
  initialize(params: {
    projectDir: string
    outputDir: string
    context: ConfigurationContext
    composition: FullXmlSyncSharedCompositionSnapshot
    index: SharedConfigurationIndexSnapshot
  }): Promise<void>
  runFirstPass(assignments: readonly FullXmlSyncAssignment[]): Promise<FullXmlSyncFirstPassPoolResult>
  runSecondPass(params: {
    sharedMetadata: FullXmlSyncSharedMetadata
  }): Promise<FullXmlSyncSecondPassPoolResult>
  close(): Promise<void>
}

export interface FullXmlSyncFirstPassPoolResult {
  diagnostics: FullXmlSyncDiagnostic[]
  projectFiles: ConfigurationProjectFile[]
  ownerFacts: FullXmlSyncOwnerFacts[]
  expectedOutputs?: import("./types").FullXmlSyncExpectedOutput[]
}

export interface FullXmlSyncSecondPassPoolResult {
  diagnostics: FullXmlSyncDiagnostic[]
  warnings: FullXmlSyncDiagnostic[]
  writtenFiles: FullXmlSyncWrittenFile[]
  fragmentData: Pick<ConfigurationIndexData, "identities" | "xmlNodes" | "xmlValues">
}

export interface FullXmlSyncWorkerThreadPool {
  run(task: FullXmlSyncWorkerCommand): Promise<unknown>
  destroy(): Promise<void>
}

type PoolPhase =
  | "new"
  | "initialized"
  | "firstPassRunning"
  | "firstPassErrors"
  | "firstPassReady"
  | "secondPassRunning"
  | "secondPassDone"
  | "crashed"
  | "closed"

export function createFullXmlSyncWorkerPool(params: {
  concurrency?: number
  createWorkerPool?: () => FullXmlSyncWorkerThreadPool
}): FullXmlSyncWorkerPool {
  const concurrency = normalizeFullXmlSyncConcurrency(params.concurrency)
  const pools = new Map<number, FullXmlSyncWorkerThreadPool>()
  const createPool = params.createWorkerPool ?? createPiscinaWorkerPool
  const activeWorkerIndexes: number[] = []
  let phase: PoolPhase = "new"
  let initialization:
    | {
        projectDir: string
        outputDir: string
        context: ConfigurationContext
        composition: FullXmlSyncSharedCompositionSnapshot
        index: SharedConfigurationIndexSnapshot
      }
    | undefined
  let fatalError: unknown
  let destroyPromise: Promise<void> | undefined

  return {
    async initialize(initializeParams) {
      assertPhase(phase, "new", "Full XML sync worker pool уже инициализирован")
      initialization = initializeParams
      phase = "initialized"
    },

    async runFirstPass(assignments) {
      assertUsable(phase, fatalError)
      assertPhase(phase, "initialized", "Первый проход full XML sync уже был запущен")
      if (initialization === undefined) throw new Error("Full XML sync worker pool не инициализирован")

      phase = "firstPassRunning"
      activeWorkerIndexes.splice(0)
      const partitions = partitionRoundRobin(assignments, concurrency)
      for (let index = 0; index < partitions.length; index += 1) {
        if ((partitions[index]?.length ?? 0) > 0) activeWorkerIndexes.push(index)
      }

      const initialized = initialization
      const results = await Promise.all(
        activeWorkerIndexes.map(async (workerIndex): Promise<FullXmlSyncFirstPassResult> => {
          const assignmentsForWorker = partitions[workerIndex] ?? []
          const initializeResponse = await runCommand(workerIndex, {
            kind: "initialize",
            workerIndex,
            projectDir: initialized.projectDir,
            outputDir: initialized.outputDir,
            context: initialized.context,
            composition: initialized.composition,
            index: initialized.index,
          })
          if (initializeResponse !== undefined) {
            return failWorker(new Error("Worker вернул неожиданный результат initialize"))
          }

          const response = await runCommand(workerIndex, { kind: "firstPass", assignments: assignmentsForWorker })
          if (response?.kind !== "firstPassResult") {
            return failWorker(new Error("Worker вернул неожиданный результат firstPass"))
          }
          return response
        })
      )

      const diagnostics = results.flatMap((result) => result.diagnostics)
      phase = diagnostics.some((diagnostic) => diagnostic.severity === "error") ? "firstPassErrors" : "firstPassReady"
      return {
        diagnostics,
        projectFiles: results.flatMap((result) => result.projectFiles).sort(compareProjectFiles),
        ownerFacts: results.flatMap((result) => result.ownerFacts),
        expectedOutputs: results.flatMap((result) => result.expectedOutputs ?? []),
      }
    },

    async runSecondPass(secondPassParams) {
      assertUsable(phase, fatalError)
      if (phase === "firstPassErrors") throw new Error("Первый проход full XML sync завершён с ошибками")
      if (phase !== "firstPassReady") throw new Error("Первый проход full XML sync не завершён успешно")

      phase = "secondPassRunning"
      const results = await Promise.all(
        activeWorkerIndexes.map(async (workerIndex): Promise<FullXmlSyncSecondPassResult> => {
          const response = await runCommand(workerIndex, { kind: "secondPass", ...secondPassParams })
          if (response?.kind !== "secondPassResult") {
            return failWorker(new Error("Worker вернул неожиданный результат secondPass"))
          }
          return response
        })
      )
      phase = "secondPassDone"
      return {
        diagnostics: results.flatMap((result) => result.diagnostics),
        warnings: results.flatMap((result) => result.warnings),
        writtenFiles: results.flatMap((result) => result.writtenFiles),
        fragmentData: mergeConfigurationIndexFragments(results.map((result) => result.fragmentBuffer)),
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
        phase = "closed"
        return
      }

      try {
        await destroyAllWorkers()
      } finally {
        phase = "closed"
      }
    },
  }

  async function runCommand(workerIndex: number, command: FullXmlSyncWorkerCommand): Promise<FullXmlSyncWorkerCommandResult> {
    try {
      return (await getOrCreatePool(workerIndex).run(command)) as FullXmlSyncWorkerCommandResult
    } catch (caught) {
      return failWorker(caught)
    }
  }

  async function failWorker(caught: unknown): Promise<never> {
    fatalError ??= caught
    phase = "crashed"
    try {
      await destroyAllWorkers()
    } catch {
      // При аварии сохраняем исходную причину, остановка остальных worker — best effort.
    }
    throw fatalError
  }

  function getOrCreatePool(workerIndex: number): FullXmlSyncWorkerThreadPool {
    const existing = pools.get(workerIndex)
    if (existing !== undefined) return existing
    const created = createPool()
    pools.set(workerIndex, created)
    return created
  }

  function destroyAllWorkers(): Promise<void> {
    destroyPromise ??= Promise.all([...pools.values()].map((pool) => pool.destroy())).then(() => undefined)
    return destroyPromise
  }
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

function compareProjectFiles(left: ConfigurationProjectFile, right: ConfigurationProjectFile): number {
  return Buffer.compare(Buffer.from(left.projectPath), Buffer.from(right.projectPath))
}

function assertUsable(phase: PoolPhase, fatalError: unknown): void {
  if (phase === "crashed") throw fatalError
  if (phase === "closed") throw new Error("Full XML sync worker pool закрыт")
}

function assertPhase(actual: PoolPhase, expected: PoolPhase, message: string): void {
  if (actual !== expected) throw new Error(message)
}
