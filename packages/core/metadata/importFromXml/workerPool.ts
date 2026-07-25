import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import Piscina from "piscina"
import { mergeConfigurationIndexFragments } from "../configurationIndex/fragment"
import type { ConfigurationIndexData } from "../configurationIndex/types"
import type { XmlImportConfigurationContext } from "../context/types"
import type { ValidationOwnerFacts } from "../validation/dataPath/ownerFacts"
import type { SharedValidationSnapshot } from "../validation/sharedValidationSnapshot"
import { createOperationProfiler } from "../validation/profile"
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
  initialize(params: { operationId: string; context: XmlImportConfigurationContext; outputDir: string }): Promise<void>
  runFirstPass(assignments: readonly ImportAssignment[]): Promise<XmlImportFirstPassPoolResult>
  runSecondPass(sharedMetadata: SharedValidationSnapshot): Promise<XmlImportSecondPassPoolResult>
  close(): Promise<void>
}

export interface XmlImportWorkerPoolHandle {
  createOperationPool(): XmlImportWorkerPool
  close(): Promise<void>
  size(): number
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
  const concurrency = normalizeConcurrency(params.concurrency)
  const pools = new Map<number, XmlImportWorkerThreadPool>()
  const createPool = params.createWorkerPool ?? createPiscinaWorkerPool

  return createXmlImportOperationPool({
    concurrency,
    getOrCreatePool(workerIndex) {
      const existing = pools.get(workerIndex)
      if (existing !== undefined) return existing
      const created = createPool()
      pools.set(workerIndex, created)
      return created
    },
    listPools() {
      return [...pools.values()]
    },
    closeMode: "destroy",
  })
}

export function createXmlImportWorkerPoolHandle(params: {
  concurrency: number
  createWorkerPool?: () => XmlImportWorkerThreadPool
}): XmlImportWorkerPoolHandle {
  const concurrency = normalizeConcurrency(params.concurrency)
  const pools = new Map<number, XmlImportWorkerThreadPool>()
  const createPool = params.createWorkerPool ?? createPiscinaWorkerPool
  let activeOperation = false
  let closed = false
  let destroyPromise: Promise<void> | undefined

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

  return {
    createOperationPool() {
      if (closed) throw new Error("XML-import worker pool handle закрыт")
      if (activeOperation) throw new Error("XML-import worker pool handle уже выполняет операцию")
      activeOperation = true

      return createXmlImportOperationPool({
        concurrency,
        getOrCreatePool,
        listPools() {
          return [...pools.values()]
        },
        closeMode: "dispose",
        async releaseOperation() {
          activeOperation = false
        },
        async destroyOnCrash() {
          closed = true
          await destroyAllWorkers()
        },
      })
    },
    async close() {
      if (closed && destroyPromise !== undefined) {
        await destroyPromise
        return
      }
      closed = true
      await destroyAllWorkers()
    },
    size() {
      return pools.size
    },
  }
}

function createXmlImportOperationPool(params: {
  concurrency: number
  getOrCreatePool(workerIndex: number): XmlImportWorkerThreadPool
  listPools(): XmlImportWorkerThreadPool[]
  closeMode: "destroy" | "dispose"
  releaseOperation?: () => Promise<void>
  destroyOnCrash?: () => Promise<void>
}): XmlImportWorkerPool {
  const activeWorkerIndexes: number[] = []
  let initialization:
    | {
        operationId: string
        context: XmlImportConfigurationContext
        outputDir: string
      }
    | undefined
  let phase: PoolPhase = "new"
  let fatalError: unknown
  let destroyPromise: Promise<void> | undefined
  let closePromise: Promise<void> | undefined

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
            outputDir: initialized.outputDir,
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
      const profiler = createOperationProfiler({ operation: "import-from-xml", scope: { scope: "main" } })
      const fragmentData = profiler.measure(
        "Подготовка импорта конфигурации",
        "Обобщение фрагментов данных файла индекса конфигурации",
        { items: results.length },
        () => mergeConfigurationIndexFragments(results.map((result) => result.fragmentBuffer))
      )
      profiler.flush()
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
      closePromise ??= closeOperation()
      return closePromise
    },
  }

  async function closeOperation(): Promise<void> {
      if (phase === "closed") return
      if (phase === "crashed") {
        try {
          await destroyAfterCrash()
        } catch {
          // Исходная ошибка worker важнее ошибки остановки уже аварийного пула.
        } finally {
          phase = "closed"
          await params.releaseOperation?.()
        }
        return
      }

      try {
        if (params.closeMode === "destroy") await destroyAllWorkers()
        else await disposeActiveWorkers()
      } finally {
        phase = "closed"
        await params.releaseOperation?.()
      }
  }

  async function runCommand(workerIndex: number, command: ImportWorkerCommand): Promise<ImportWorkerCommandResult> {
    try {
      return (await params.getOrCreatePool(workerIndex).run(command)) as ImportWorkerCommandResult
    } catch (caught) {
      return failWorker(caught)
    }
  }

  async function failWorker(caught: unknown): Promise<never> {
    fatalError ??= caught
    phase = "crashed"
    try {
      await destroyAfterCrash()
    } catch {
      // При аварии сохраняем исходную причину, остановка остальных worker — best effort.
    }
    throw fatalError
  }

  function destroyAllWorkers(): Promise<void> {
    destroyPromise ??= Promise.all(params.listPools().map((pool) => pool.destroy())).then(() => undefined)
    return destroyPromise
  }

  function destroyAfterCrash(): Promise<void> {
    return params.destroyOnCrash?.() ?? destroyAllWorkers()
  }

  async function disposeActiveWorkers(): Promise<void> {
    await Promise.all(
      activeWorkerIndexes.map(async (workerIndex) => {
        const response = await runCommand(workerIndex, { kind: "dispose" })
        if (response !== undefined) throw new Error("Worker вернул неожиданный результат dispose")
      })
    )
  }
}

function normalizeConcurrency(concurrency: number): number {
  if (!Number.isSafeInteger(concurrency) || concurrency < 1) {
    throw new Error("Степень параллелизма XML-import должна быть положительным целым числом")
  }
  return concurrency
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
