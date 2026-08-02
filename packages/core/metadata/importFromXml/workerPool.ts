import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import Piscina from "piscina"
import type { ConfigurationSnapshotFragment } from "../configurationIndex/types"
import type { ConfigurationContextFromXML, XmlImportConfigurationContext } from "../context/types"
import { sourceWorkerExecArgv } from "../sourceWorkerRuntime"
import type { ValidationOwnerFacts } from "../validation/dataPath/ownerFacts"
import type { ValidationIndexContribution } from "../validation/projectValidationTypes"
import type { ProjectStateReadToken } from "../projectState/contracts"
import type {
  ProjectStateImportFinalFileStateBatch,
  ProjectStateImportIndexContribution,
} from "../projectState/importSession"
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
  initialize(params: {
    operationId: string
    context: ConfigurationContextFromXML
    outputDir: string
    projectDir?: string
    componentPath?: string
    componentKind: string
    metadataItemAugmenter?: string
  }): Promise<void>
  runFirstPass(
    assignments: readonly ImportAssignment[],
    sink?: XmlImportStateSink,
  ): Promise<XmlImportFirstPassPoolResult>
  runSecondPass(
    readTokens: readonly ProjectStateReadToken[],
    sink?: XmlImportStateSink,
  ): Promise<XmlImportSecondPassPoolResult>
  workerCount(): number
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
  validationContribution: ValidationIndexContribution
  files: ImportResultFile[]
}

export interface XmlImportSecondPassPoolResult {
  diagnostics: ImportDiagnostic[]
  warnings: ImportDiagnostic[]
  files: ImportResultFile[]
}

export interface XmlImportStateBatch {
  readonly configurationFragment?: ConfigurationSnapshotFragment
  readonly indexContributions: readonly ProjectStateImportIndexContribution[]
  readonly finalFileStateBatches: readonly ProjectStateImportFinalFileStateBatch[]
}

export interface XmlImportStateSink {
  writeFirstPassState(batch: XmlImportStateBatch): Promise<void>
  writeSecondPassState(batch: Omit<XmlImportStateBatch, "indexContributions">): Promise<void>
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
  maxPendingStateBatches?: number
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
    maxPendingStateBatches: normalizePendingStateBatches(params.maxPendingStateBatches),
  })
}

export function createXmlImportWorkerPoolHandle(params: {
  concurrency: number
  createWorkerPool?: () => XmlImportWorkerThreadPool
  maxPendingStateBatches?: number
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
    destroyPromise ??= destroyWorkerPools([...pools.values()])
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
        maxPendingStateBatches: normalizePendingStateBatches(params.maxPendingStateBatches),
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
  maxPendingStateBatches: number
}): XmlImportWorkerPool {
  const activeWorkerIndexes: number[] = []
  const assignmentIdsByWorker = new Map<number, string[]>()
  let initialization:
    | {
        operationId: string
        context: ConfigurationContextFromXML
        outputDir: string
        projectDir?: string
        componentPath?: string
        componentKind: string
        metadataItemAugmenter?: string
      }
    | undefined
  let phase: PoolPhase = "new"
  let fatalError: unknown
  let destroyPromise: Promise<void> | undefined
  let crashCleanupPromise: Promise<unknown | undefined> | undefined
  let closePromise: Promise<void> | undefined
  const stateQueue = createBoundedStateQueue(params.maxPendingStateBatches)

  return {
    async initialize(initializeParams) {
      assertPhase(phase, "new", "XML-import worker pool уже инициализирован")
      initialization = initializeParams
      phase = "initialized"
    },

    async runFirstPass(assignments, sink = noopStateSink) {
      assertUsable(phase, fatalError)
      assertPhase(phase, "initialized", "Первый проход XML-import уже был запущен")
      if (initialization === undefined) throw new Error("XML-import worker pool не инициализирован")
      const initialized = initialization

      phase = "firstPassRunning"
      const partitions = partitionRoundRobin(assignments, params.concurrency)
      for (let index = 0; index < partitions.length; index += 1) {
        const partition = partitions[index] ?? []
        if (partition.length > 0) {
          activeWorkerIndexes.push(index)
          assignmentIdsByWorker.set(index, partition.map(({ id }) => id))
        }
      }

      const resultsByWorker = await superviseWorkerJobs(
        activeWorkerIndexes.map((workerIndex) => async (): Promise<ImportFirstPassResult[]> => {
          assertProducerActive("firstPassRunning")
          const assignmentsForWorker = partitions[workerIndex] ?? []
          const initializeResponse = await runCommand(workerIndex, {
            kind: "initialize",
            operationId: initialized.operationId,
            workerIndex,
            context: xmlImportContext(initialized),
            outputDir: initialized.outputDir,
            projectDir: initialized.projectDir,
            componentPath: initialized.componentPath,
          })
          if (initializeResponse !== undefined) {
            throw new Error("Worker вернул неожиданный результат initialize")
          }

          const workerResults: ImportFirstPassResult[] = []
          for (const assignment of assignmentsForWorker) {
            assertProducerActive("firstPassRunning")
            const response = await runCommand(workerIndex, {
              kind: "firstPass",
              assignments: [assignment],
            })
            if (response?.kind !== "firstPassResult") {
              throw new Error("Worker вернул неожиданный результат firstPass")
            }
            if (response.configurationFragments.length > 1) {
              throw new Error("Worker вернул больше одного fragment на assignment")
            }
            await stateQueue.run(() => {
              assertProducerActive("firstPassRunning")
              return sink.writeFirstPassState({
                ...(response.configurationFragments[0] === undefined
                  ? {}
                  : { configurationFragment: response.configurationFragments[0] }),
                indexContributions: response.indexContributions,
                finalFileStateBatches: response.finalFileStateBatches,
              })
            })
            workerResults.push(withoutFirstPassState(response))
          }
          return workerResults
        })
      )
      const results = resultsByWorker.flat()

      const diagnostics = results.flatMap((result) => result.diagnostics)
      phase = diagnostics.some((diagnostic) => diagnostic.severity === "error") ? "firstPassErrors" : "firstPassReady"
      return {
        diagnostics,
        ownerFacts: results.flatMap((result) => result.ownerFacts),
        files: results.flatMap((result) => result.files),
        validationContribution: {
          objectRecords: results.flatMap((result) => result.validationContribution.objectRecords),
          objectIndexEntries: results.flatMap((result) => result.validationContribution.objectIndexEntries),
          memberIndexEntries: results.flatMap((result) => result.validationContribution.memberIndexEntries),
          valueIndexEntries: results.flatMap((result) => result.validationContribution.valueIndexEntries),
          pendingReferences: results.flatMap((result) => result.validationContribution.pendingReferences),
          localDependencies: results.flatMap((result) => result.validationContribution.localDependencies),
          logicalAddresses: results.flatMap((result) => result.validationContribution.logicalAddresses),
        },
      }
    },

    async runSecondPass(readTokens, sink = noopStateSink) {
      assertUsable(phase, fatalError)
      if (phase === "firstPassErrors") throw new Error("Первый проход import завершён с ошибками")
      if (phase !== "firstPassReady") throw new Error("Первый проход import не завершён успешно")

      phase = "secondPassRunning"
      if (readTokens.length !== activeWorkerIndexes.length) {
        throw new Error(`Второму проходу import требуется ${activeWorkerIndexes.length} отдельных read token`)
      }
      const results = await superviseWorkerJobs(
        activeWorkerIndexes.map((workerIndex, activeIndex) => async (): Promise<ImportSecondPassResult> => {
          assertProducerActive("secondPassRunning")
          const beginResponse = await runCommand(workerIndex, {
            kind: "beginSecondPass",
            readToken: readTokens[activeIndex]!,
          })
          if (beginResponse !== undefined) {
            throw new Error("Worker вернул неожиданный результат beginSecondPass")
          }
          const workerResults: ImportSecondPassResult[] = []
          for (const assignmentId of assignmentIdsByWorker.get(workerIndex) ?? []) {
            assertProducerActive("secondPassRunning")
            const response = await runCommand(workerIndex, { kind: "secondPass", assignmentId })
            if (response?.kind !== "secondPassResult") {
              throw new Error("Worker вернул неожиданный результат secondPass")
            }
            await stateQueue.run(() => {
              assertProducerActive("secondPassRunning")
              return sink.writeSecondPassState({
                finalFileStateBatches: response.finalFileStateBatches,
              })
            })
            workerResults.push(withoutSecondPassState(response))
          }
          assertProducerActive("secondPassRunning")
          const endResponse = await runCommand(workerIndex, { kind: "endSecondPass" })
          if (endResponse !== undefined) {
            throw new Error("Worker вернул неожиданный результат endSecondPass")
          }
          return mergeSecondPassResults(workerResults)
        })
      )
      phase = "secondPassDone"
      return {
        diagnostics: results.flatMap((result) => result.diagnostics),
        warnings: results.flatMap((result) => result.warnings),
        files: results.flatMap((result) => result.files),
      }
    },
    workerCount() {
      return activeWorkerIndexes.length
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
        await crashCleanupPromise
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
    return (await params.getOrCreatePool(workerIndex).run(command)) as ImportWorkerCommandResult
  }

  function beginCrash(caught: unknown): void {
    fatalError ??= caught
    phase = "crashed"
    crashCleanupPromise ??= destroyAfterCrash().then(
      () => undefined,
      (cleanupFailure: unknown) => cleanupFailure,
    )
  }

  async function superviseWorkerJobs<T>(jobs: readonly (() => Promise<T>)[]): Promise<T[]> {
    const settled = await Promise.allSettled(jobs.map(async (job) => {
      try {
        return await job()
      } catch (caught) {
        beginCrash(caught)
        throw caught
      }
    }))
    const rejected = settled.filter((result): result is PromiseRejectedResult => result.status === "rejected")
    if (rejected.length === 0) {
      return settled.map((result) => (result as PromiseFulfilledResult<T>).value)
    }
    const primary = fatalError
    const failures: unknown[] = [primary]
    for (const result of rejected) appendSecondaryFailures(failures, result.reason)
    const cleanupFailure = await crashCleanupPromise
    if (cleanupFailure !== undefined) appendSecondaryFailures(failures, cleanupFailure)
    if (failures.length === 1) throw primary
    throw new AggregateError(failures, workerFailureMessage(primary))
  }

  function assertProducerActive(expectedPhase: "firstPassRunning" | "secondPassRunning"): void {
    if (phase === "crashed") throw fatalError
    if (phase !== expectedPhase) throw new Error("XML-import worker pool завершает операцию")
  }

  function destroyAllWorkers(): Promise<void> {
    destroyPromise ??= destroyWorkerPools(params.listPools())
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

const noopStateSink: XmlImportStateSink = {
  async writeFirstPassState() {},
  async writeSecondPassState() {},
}

function appendSecondaryFailures(failures: unknown[], caught: unknown): void {
  for (const failure of collectFailureLeaves(caught)) {
    if (!failures.includes(failure)) failures.push(failure)
  }
}

function collectFailureLeaves(caught: unknown): unknown[] {
  const pending = [caught]
  const leaves: unknown[] = []
  while (pending.length > 0) {
    const failure = pending.shift()
    if (failure instanceof AggregateError) pending.unshift(...failure.errors)
    else leaves.push(failure)
  }
  return leaves
}

function workerFailureMessage(caught: unknown): string {
  return caught instanceof Error ? caught.message : String(caught)
}

async function destroyWorkerPools(pools: readonly XmlImportWorkerThreadPool[]): Promise<void> {
  const settled = await Promise.allSettled(
    pools.map((pool) => Promise.resolve().then(() => pool.destroy())),
  )
  const failures = settled.flatMap((result) => result.status === "rejected" ? collectFailureLeaves(result.reason) : [])
  if (failures.length === 1) throw failures[0]
  if (failures.length > 1) throw new AggregateError(failures, workerFailureMessage(failures[0]))
}

function withoutFirstPassState(result: ImportFirstPassResult): ImportFirstPassResult {
  return { ...result, configurationFragments: [], indexContributions: [], finalFileStateBatches: [] }
}

function withoutSecondPassState(result: ImportSecondPassResult): ImportSecondPassResult {
  return { ...result, finalFileStateBatches: [] }
}

function mergeSecondPassResults(results: readonly ImportSecondPassResult[]): ImportSecondPassResult {
  return {
    kind: "secondPassResult",
    diagnostics: results.flatMap(({ diagnostics }) => diagnostics),
    warnings: results.flatMap(({ warnings }) => warnings),
    files: results.flatMap(({ files }) => files),
    finalFileStateBatches: [],
  }
}

function createBoundedStateQueue(limit: number) {
  const active = new Set<Promise<void>>()
  return {
    async run(task: () => Promise<void>): Promise<void> {
      while (active.size >= limit) await Promise.race(active)
      const running = task()
      active.add(running)
      try {
        await running
      } finally {
        active.delete(running)
      }
    },
  }
}

function normalizePendingStateBatches(value: number | undefined): number {
  const normalized = value ?? 2
  if (!Number.isSafeInteger(normalized) || normalized < 1) {
    throw new Error("Лимит неподтверждённых import state batches должен быть положительным целым числом")
  }
  return normalized
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
  if (phase === "closed") throw new Error("XML-import worker pool закрыт")
}

function assertPhase(actual: PoolPhase, expected: PoolPhase, message: string): void {
  if (actual !== expected) throw new Error(message)
}

function xmlImportContext(params: {
  context: ConfigurationContextFromXML
  componentKind: string
  metadataItemAugmenter?: string
}): XmlImportConfigurationContext {
  return {
    ...params.context,
    fromXML: {
      ...params.context.fromXML,
      componentKind: params.componentKind,
      ...(params.metadataItemAugmenter === undefined ? {} : { metadataItemAugmenter: params.metadataItemAugmenter }),
    },
  }
}
