import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import Piscina from "piscina"
import { mergeConfigurationIndexFragments } from "../configurationIndex/fragment"
import type { ConfigurationIndexData } from "../configurationIndex/types"
import type { ConfigurationContextFromXML } from "../context/types"
import type { ValidationOwnerFacts } from "../validation/dataPath/ownerFacts"
import type { SharedValidationSnapshot } from "../validation/sharedValidationSnapshot"
import type {
  ImportAssignment,
  ImportDiagnostic,
  ImportFirstPassResult,
  ImportResultFile,
  ImportSecondPassResult,
  ImportWorkerCommand,
  ImportWorkerCommandResult,
} from "./types"

export interface XmlImportWorkerPool {
  initialize(params: { operationId: string; context: ConfigurationContextFromXML; tempRoot: string }): Promise<void>
  runFirstPass(assignments: readonly ImportAssignment[]): Promise<XmlImportFirstPassPoolResult>
  runSecondPass(sharedMetadata: SharedValidationSnapshot): Promise<XmlImportSecondPassPoolResult>
  close(): Promise<void>
}

export interface XmlImportFirstPassPoolResult {
  diagnostics: ImportDiagnostic[]
  ownerFacts: ValidationOwnerFacts[]
  fragmentData: Pick<ConfigurationIndexData, "identities" | "xmlNodes" | "xmlValues">
}

export interface XmlImportSecondPassPoolResult {
  diagnostics: ImportDiagnostic[]
  warnings: ImportDiagnostic[]
  files: ImportResultFile[]
}

export interface XmlImportWorkerThreadPool {
  run(task: ImportWorkerCommand): Promise<unknown>
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

export function createXmlImportWorkerPool(params: {
  concurrency: number
  createWorkerPool?: () => XmlImportWorkerThreadPool
}): XmlImportWorkerPool {
  if (!Number.isSafeInteger(params.concurrency) || params.concurrency < 1) {
    throw new Error("Степень параллелизма XML-import должна быть положительным целым числом")
  }

  const pools = new Map<number, XmlImportWorkerThreadPool>()
  const createPool = params.createWorkerPool ?? createPiscinaWorkerPool
  const activeWorkerIndexes: number[] = []
  let phase: PoolPhase = "new"
  let initialization:
    | {
        operationId: string
        context: ConfigurationContextFromXML
        tempRoot: string
      }
    | undefined
  let fatalError: unknown
  let destroyPromise: Promise<void> | undefined

  return {
    async initialize(initializeParams) {
      assertPhase(phase, "new", "XML-import worker pool уже инициализирован")
      initialization = initializeParams
      phase = "initialized"
    },

    async runFirstPass(assignments) {
      assertUsable(phase, fatalError)
      assertPhase(phase, "initialized", "Первый проход XML-import уже был запущен")
      if (initialization === undefined) throw new Error("XML-import worker pool не инициализирован")
      const initialized = initialization

      phase = "firstPassRunning"
      const partitions = partitionRoundRobin(assignments, params.concurrency)
      for (let index = 0; index < partitions.length; index += 1) {
        if ((partitions[index]?.length ?? 0) > 0) activeWorkerIndexes.push(index)
      }

      const results = await Promise.all(
        activeWorkerIndexes.map(async (workerIndex): Promise<ImportFirstPassResult> => {
          const assignmentsForWorker = partitions[workerIndex] ?? []
          const initializeResponse = await runCommand(workerIndex, {
            kind: "initialize",
            operationId: initialized.operationId,
            workerIndex,
            context: initialized.context,
            tempDir: join(initialized.tempRoot, `worker-${workerIndex}`),
          })
          if (initializeResponse !== undefined) {
            return failWorker(new Error("Worker вернул неожиданный результат initialize"))
          }

          const response = await runCommand(workerIndex, {
            kind: "firstPass",
            assignments: [...assignmentsForWorker],
          })
          if (response?.kind !== "firstPassResult") {
            return failWorker(new Error("Worker вернул неожиданный результат firstPass"))
          }
          return response
        })
      )

      const diagnostics = results.flatMap((result) => result.diagnostics)
      const fragmentData = mergeConfigurationIndexFragments(results.map((result) => result.fragmentBuffer))
      phase = diagnostics.some((diagnostic) => diagnostic.severity === "error") ? "firstPassErrors" : "firstPassReady"
      return {
        diagnostics,
        ownerFacts: results.flatMap((result) => result.ownerFacts),
        fragmentData,
      }
    },

    async runSecondPass(sharedMetadata) {
      assertUsable(phase, fatalError)
      if (phase === "firstPassErrors") throw new Error("Первый проход import завершён с ошибками")
      if (phase !== "firstPassReady") throw new Error("Первый проход import не завершён успешно")

      phase = "secondPassRunning"
      const results = await Promise.all(
        activeWorkerIndexes.map(async (workerIndex): Promise<ImportSecondPassResult> => {
          const response = await runCommand(workerIndex, { kind: "secondPass", sharedMetadata })
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
        files: results.flatMap((result) => result.files),
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

  async function runCommand(workerIndex: number, command: ImportWorkerCommand): Promise<ImportWorkerCommandResult> {
    try {
      return (await getOrCreatePool(workerIndex).run(command)) as ImportWorkerCommandResult
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

  function getOrCreatePool(workerIndex: number): XmlImportWorkerThreadPool {
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

function createPiscinaWorkerPool(): Piscina {
  const currentFile = fileURLToPath(import.meta.url)
  const workerFile = currentFile.endsWith(".ts")
    ? join(dirname(currentFile), "worker.ts")
    : join(dirname(currentFile), "importFromXmlWorker.js")
  const execArgv = currentFile.endsWith(".ts") ? ["--import", "tsx"] : []
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
  if (phase === "closed") throw new Error("XML-import worker pool закрыт")
}

function assertPhase(actual: PoolPhase, expected: PoolPhase, message: string): void {
  if (actual !== expected) throw new Error(message)
}
