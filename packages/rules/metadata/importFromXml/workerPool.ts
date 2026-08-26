import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import Piscina from "piscina"
import type { ConfigurationIndexBlockFragment } from "@nkdk/runtime"
import type { ConfigurationContextFromXML, XmlImportConfigurationContext } from "@nkdk/runtime"
import { sourceWorkerExecArgv } from "../sourceWorkerRuntime"
import type { ProjectStateReadToken } from "../projectState/contracts"
import type { ProjectStateFragment } from "../projectState/binary/fragment"
import type { MetadataWorkerOperation } from "../workerPool/types"
import type { DiagnosticBatchView } from "@nkdk/runtime"
import type { ConfigurationIndexStoreDescriptor } from "@nkdk/runtime"
import type {
  PreparedImportRecordLocator,
  PreparedImportStoreDescriptor,
} from "../projectState/preparedImportStore"
import { createOperationProfiler } from "../validation/profile"
import {
  createMetadataDiagnosticCollection,
  type MetadataDiagnosticCollection,
} from "@nkdk/runtime"
import type {
  ImportAssignment,
  ImportControlCompositionEntry,
  ImportDiagnostic,
  ImportProjectIssueDecision,
  ImportResultFile,
  ImportWorkerCommand,
  ImportWorkerCommandResult,
} from "./types"
import { importControlCompositionEntry } from "./types"
import {
  importDiagnosticValue,
  openImportBinaryResult,
  type ImportResultFileBatchView,
} from "./binaryResult"
import type { XmlComponentExportProfile } from "../project/xmlReconstructionProfile"

export interface XmlImportWorkerPool {
  initialize(params: {
    operationId: string
    context: ConfigurationContextFromXML
    outputDir: string
    projectDir?: string
    componentPath?: string
    componentKind: string
    metadataItemAugmenter?: string
    preparedStore?: PreparedImportStoreDescriptor
    configurationIndex?: ConfigurationIndexStoreDescriptor
    baseConfigurationIndex?: ConfigurationIndexStoreDescriptor
  }): Promise<void>
  runFirstPass(
    assignments: readonly ImportAssignment[],
    sink?: XmlImportStateSink,
  ): Promise<XmlImportFirstPassPoolResult>
  runSecondPass(
    readTokens: readonly ProjectStateReadToken[],
    exportProfile: XmlComponentExportProfile,
    sink?: XmlImportStateSink,
  ): Promise<XmlImportSecondPassPoolResult>
  runThirdPass(
    readTokens: readonly ProjectStateReadToken[],
    sink?: XmlImportStateSink,
    issueDecisions?: readonly ImportProjectIssueDecision[],
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
  diagnostics: ImportDiagnosticCollection
  files: ImportResultFileCollection
  prepared: readonly PreparedImportRecordLocator[]
}

export interface XmlImportSecondPassPoolResult {
  diagnostics: ImportDiagnosticCollection
  warnings: ImportDiagnosticCollection
  files: ImportResultFileCollection
}

export interface ImportDiagnosticCollection extends Iterable<ImportDiagnostic> {
  readonly errors: number
  readonly warnings: number
  readonly count: number
  readonly released: boolean
  release(): void
}

export interface ImportResultFileCollection extends Iterable<ImportResultFile> {
  readonly count: number
  readonly released: boolean
  release(): void
}

export interface XmlImportStateBatch {
  readonly configurationFragment?: ConfigurationIndexBlockFragment
  readonly configurationFragmentBuffer?: ArrayBuffer
  readonly stateFragment?: ProjectStateFragment
  readonly preparedRecords?: readonly import("./types").PreparedImportBinaryRecord[]
}

export interface XmlImportStateSink {
  writeFirstPassState(batch: XmlImportStateBatch): Promise<void>
  writeSecondPassState(batch: XmlImportStateBatch): Promise<void>
  writeThirdPassState?(batch: XmlImportStateBatch): Promise<void>
  releasePrepared?(assignmentIds: readonly string[]): Promise<void>
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
  | "thirdPassRunning"
  | "thirdPassDone"
  | "crashed"
  | "closed"

export function createXmlImportWorkerPool(params: {
  concurrency: number
  createWorkerPool?: () => XmlImportWorkerThreadPool
  operation?: MetadataWorkerOperation
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
      const created = params.operation === undefined
        ? createPool()
        : createOperationWorkerPool(params.operation, workerIndex)
      pools.set(workerIndex, created)
      return created
    },
    listPools() {
      return [...pools.values()]
    },
    closeMode: params.operation === undefined ? "destroy" : "dispose",
    ...(params.operation === undefined ? {} : {
      releaseOperation: () => params.operation!.finish("success"),
      destroyOnCrash: () => params.operation!.finish("failure"),
    }),
    maxPendingStateBatches: normalizePendingStateBatches(params.maxPendingStateBatches),
  })
}

function createOperationWorkerPool(
  operation: MetadataWorkerOperation,
  workerIndex: number,
): XmlImportWorkerThreadPool {
  return {
    async run(command) {
      const response = await operation.run(workerIndex, { kind: "import", command })
      if (response.kind !== "importResult") {
        throw new Error("Универсальный worker вернул неожиданный результат import")
      }
      return response.result
    },
    async destroy() {},
  }
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
  let controlComposition: ImportControlCompositionEntry[] = []
  let preparedLocators: PreparedImportRecordLocator[] = []
  let initialization:
    | {
        operationId: string
        context: ConfigurationContextFromXML
        outputDir: string
        projectDir?: string
        componentPath?: string
        componentKind: string
        metadataItemAugmenter?: string
        preparedStore?: PreparedImportStoreDescriptor
        configurationIndex?: ConfigurationIndexStoreDescriptor
        baseConfigurationIndex?: ConfigurationIndexStoreDescriptor
      }
    | undefined
  let phase: PoolPhase = "new"
  let fatalError: unknown
  let destroyPromise: Promise<void> | undefined
  let crashCleanupPromise: Promise<unknown | undefined> | undefined
  let closePromise: Promise<void> | undefined
  const stateQueue = createBoundedStateQueue(params.maxPendingStateBatches)
  const transferProfiler = createOperationProfiler({ operation: "import-from-xml", scope: { scope: "main" }, aggregate: true })

  async function runFollowingPass(
    pass: "second" | "third",
    readTokens: readonly ProjectStateReadToken[],
    sink: XmlImportStateSink,
    exportProfile?: XmlComponentExportProfile,
    issueDecisions: readonly ImportProjectIssueDecision[] = [],
  ): Promise<XmlImportSecondPassPoolResult> {
    const runningPhase = pass === "second" ? "secondPassRunning" : "thirdPassRunning"
    const donePhase = pass === "second" ? "secondPassDone" : "thirdPassDone"
    const passName = pass === "second" ? "Второму" : "Третьему"
    if (readTokens.length !== activeWorkerIndexes.length) {
      throw new Error(`${passName} проходу import требуется ${activeWorkerIndexes.length} отдельных read token`)
    }
    phase = runningPhase
    const diagnosticViewsByWorker: DiagnosticBatchView[][] = []
    const warningViewsByWorker: DiagnosticBatchView[][] = []
    const fileViewsByWorker: ImportResultFileBatchView[][] = []
    const dynamicQueue = pass === "second" && preparedLocators.length > 0
      ? [...preparedLocators].sort((left, right) => right.weight - left.weight)
      : undefined
    if (dynamicQueue !== undefined) assignmentIdsByWorker.clear()
    await superviseWorkerJobs(
      activeWorkerIndexes.map((workerIndex, activeIndex) => async (): Promise<void> => {
        const diagnosticViews: DiagnosticBatchView[] = []
        const warningViews: DiagnosticBatchView[] = []
        const fileViews: ImportResultFileBatchView[] = []
        diagnosticViewsByWorker[workerIndex] = diagnosticViews
        warningViewsByWorker[workerIndex] = warningViews
        fileViewsByWorker[workerIndex] = fileViews
        assertProducerActive(runningPhase)
        const beginCommand: ImportWorkerCommand = pass === "second"
          ? secondPassBeginCommand(readTokens[activeIndex]!, controlComposition, exportProfile)
          : { kind: "beginThirdPass", readToken: readTokens[activeIndex]!, issueDecisions }
        const beginResponse = await runCommand(workerIndex, beginCommand)
        if (beginResponse !== undefined) {
          throw new Error(`Worker вернул неожиданный результат ${beginCommand.kind}`)
        }
        const assignmentIds = dynamicQueue === undefined ? assignmentIdsByWorker.get(workerIndex) ?? [] : []
        const assignmentBatches = dynamicQueue === undefined
          ? fixedAssignmentBatches(assignmentIds)
          : dynamicAssignmentBatches(dynamicQueue, assignmentIds)
        for (const assignmentIdsBatch of assignmentBatches) {
          assertProducerActive(runningPhase)
          const batchCommand: ImportWorkerCommand = pass === "second"
            ? { kind: "secondPassBatch", assignmentIds: assignmentIdsBatch }
            : { kind: "thirdPassBatch", assignmentIds: assignmentIdsBatch }
          const response = await runCommand(workerIndex, batchCommand)
          const batch = openProfiledImportBinaryResult(response, transferProfiler)
          diagnosticViews.push(batch.diagnostics)
          warningViews.push(batch.warnings)
          fileViews.push(batch.files)
          if (batch.configurationFragmentBuffer !== undefined
            || batch.stateFragment !== undefined
            || (pass === "third" && sink.releasePrepared !== undefined)) {
            const writeState = pass === "second"
              ? sink.writeSecondPassState
              : sink.writeThirdPassState ?? sink.writeSecondPassState
            await stateQueue.run(async () => {
              await writeState({
                ...(batch.configurationFragmentBuffer === undefined
                  ? {}
                  : { configurationFragmentBuffer: batch.configurationFragmentBuffer }),
                ...(batch.stateFragment === undefined ? {} : { stateFragment: batch.stateFragment }),
              })
              if (pass === "third") await sink.releasePrepared?.(assignmentIdsBatch)
            })
          }
        }
        if (dynamicQueue !== undefined) assignmentIdsByWorker.set(workerIndex, assignmentIds)
        assertProducerActive(runningPhase)
        const finishCommand: ImportWorkerCommand = pass === "second"
          ? { kind: "finishSecondPass" }
          : { kind: "finishThirdPass" }
        const finishResponse = await runCommand(workerIndex, finishCommand)
        if (finishResponse !== undefined) {
          throw new Error(`Worker вернул неожиданный результат ${finishCommand.kind}`)
        }
      }),
    )
    await superviseWorkerJobs([() => stateQueue.flush()])
    phase = donePhase
    return {
      diagnostics: createImportDiagnosticCollection(collectViews(diagnosticViewsByWorker)),
      warnings: createImportDiagnosticCollection(collectViews(warningViewsByWorker)),
      files: createImportResultFileCollection(collectViews(fileViewsByWorker)),
    }
  }

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
      controlComposition = assignments.map(importControlCompositionEntry)
      const partitions = partitionRoundRobin(assignments, params.concurrency)
      const diagnosticViewsByWorker: DiagnosticBatchView[][] = []
      const fileViewsByWorker: ImportResultFileBatchView[][] = []
      preparedLocators = []
      for (let index = 0; index < partitions.length; index += 1) {
        const partition = partitions[index] ?? []
        if (partition.length > 0) {
          activeWorkerIndexes.push(index)
          assignmentIdsByWorker.set(index, partition.map(({ id }) => id))
        }
      }

      const resultsByWorker = await superviseWorkerJobs(
        activeWorkerIndexes.map((workerIndex) => async (): Promise<void> => {
          const diagnosticViews: DiagnosticBatchView[] = []
          const fileViews: ImportResultFileBatchView[] = []
          diagnosticViewsByWorker[workerIndex] = diagnosticViews
          fileViewsByWorker[workerIndex] = fileViews
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
            ...(initialized.preparedStore === undefined ? {} : { preparedStore: initialized.preparedStore }),
            ...(initialized.configurationIndex === undefined
              ? {}
              : { configurationIndex: initialized.configurationIndex }),
            ...(initialized.baseConfigurationIndex === undefined
              ? {}
              : { baseConfigurationIndex: initialized.baseConfigurationIndex }),
          })
          if (initializeResponse !== undefined) {
            throw new Error("Worker вернул неожиданный результат initialize")
          }

          for (let offset = 0; offset < assignmentsForWorker.length; offset += 256) {
            assertProducerActive("firstPassRunning")
            const response = await runCommand(workerIndex, {
              kind: "firstPassBatch",
              assignments: assignmentsForWorker.slice(offset, offset + 256),
            })
            const batch = openProfiledImportBinaryResult(response, transferProfiler)
            diagnosticViews.push(batch.diagnostics)
            fileViews.push(batch.files)
            preparedLocators.push(...batch.preparedRecords.map(({ locator }) => locator))
            if (batch.configurationFragmentBuffer !== undefined
              || batch.stateFragment !== undefined
              || batch.preparedRecords.length > 0) {
              await stateQueue.run(() => transferProfiler.measureAsync(
                "Подготовка импорта конфигурации",
                "Применение состояния пачки первого прохода",
                { items: 1 },
                () => {
                  assertProducerActive("firstPassRunning")
                  return sink.writeFirstPassState({
                    ...(batch.configurationFragmentBuffer === undefined
                      ? {}
                      : { configurationFragmentBuffer: batch.configurationFragmentBuffer }),
                    ...(batch.stateFragment === undefined ? {} : { stateFragment: batch.stateFragment }),
                    ...(batch.preparedRecords.length === 0 ? {} : { preparedRecords: batch.preparedRecords }),
                  })
                },
              ))
            }
          }
          const response = await runCommand(workerIndex, { kind: "finishFirstPass" })
          if (response !== undefined) {
            throw new Error("Worker вернул неожиданный результат finishFirstPass")
          }
        })
      )
      await superviseWorkerJobs([() => stateQueue.flush()])
      void resultsByWorker
      const diagnostics = createImportDiagnosticCollection(collectViews(diagnosticViewsByWorker))
      phase = diagnostics.errors > 0 ? "firstPassErrors" : "firstPassReady"
      return {
        diagnostics,
        files: createImportResultFileCollection(collectViews(fileViewsByWorker)),
        prepared: preparedLocators,
      }
    },

    async runSecondPass(readTokens, exportProfile, sink = noopStateSink) {
      assertUsable(phase, fatalError)
      if (phase === "firstPassErrors") throw new Error("Первый проход import завершён с ошибками")
      if (phase !== "firstPassReady") throw new Error("Первый проход import не завершён успешно")
      return runFollowingPass("second", readTokens, sink, exportProfile)
    },
    async runThirdPass(readTokens, sink = noopStateSink, issueDecisions = []) {
      assertUsable(phase, fatalError)
      if (phase !== "secondPassDone") throw new Error("Второй проход import не завершён успешно")
      return runFollowingPass("third", readTokens, sink, undefined, issueDecisions)
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
        transferProfiler.flush()
        await params.releaseOperation?.()
      }
      return
    }

    try {
      if (params.closeMode === "destroy") await destroyAllWorkers()
      else await disposeActiveWorkers()
    } finally {
      phase = "closed"
      transferProfiler.flush()
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
    const failures = collectFailureLeaves(primary)
    for (const result of rejected) appendSecondaryFailures(failures, result.reason)
    const cleanupFailure = await crashCleanupPromise
    if (cleanupFailure !== undefined) appendSecondaryFailures(failures, cleanupFailure)
    if (failures.length === 1) throw primary
    throw new AggregateError(failures, workerFailureMessage(primary))
  }

  function assertProducerActive(
    expectedPhase: "firstPassRunning" | "secondPassRunning" | "thirdPassRunning",
  ): void {
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

function openProfiledImportBinaryResult(
  response: ImportWorkerCommandResult,
  profiler: ReturnType<typeof createOperationProfiler>,
) {
  const startedAt = performance.now()
  const batch = openImportBinaryResult(response)
  profiler.record("Подготовка импорта конфигурации", "Передача двоичного результата", {
    items: 1,
    bytes: response?.kind === "binaryResult"
      ? response.buffers.reduce((total, { buffer }) => total + buffer.byteLength, 0)
      : 0,
    timeMs: performance.now() - startedAt,
  })
  return batch
}

const noopStateSink: XmlImportStateSink = {
  async writeFirstPassState() {},
  async writeSecondPassState() {},
  async writeThirdPassState() {},
}

function* fixedAssignmentBatches(assignmentIds: readonly string[]): Generator<string[]> {
  for (let offset = 0; offset < assignmentIds.length; offset += 256) {
    yield assignmentIds.slice(offset, offset + 256)
  }
}

function* dynamicAssignmentBatches(
  queue: PreparedImportRecordLocator[],
  assigned: string[],
): Generator<string[]> {
  while (queue.length > 0) {
    const locator = queue.shift()
    if (locator === undefined) return
    assigned.push(locator.assignmentId)
    yield [locator.assignmentId]
  }
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

function collectViews<T>(viewsByWorker: readonly (readonly T[] | undefined)[]): T[] {
  const result: T[] = []
  for (const views of viewsByWorker) {
    if (views !== undefined) result.push(...views)
  }
  return result
}

function createImportDiagnosticCollection(sources: readonly DiagnosticBatchView[]): ImportDiagnosticCollection {
  const diagnostics: MetadataDiagnosticCollection = createMetadataDiagnosticCollection(sources)
  return {
    get errors() { return diagnostics.errors },
    get warnings() { return diagnostics.warnings },
    get count() { return diagnostics.count },
    get released() { return diagnostics.released },
    release() { diagnostics.release() },
    *[Symbol.iterator]() {
      for (const diagnostic of diagnostics) yield importDiagnosticValue(diagnostic)
    },
  }
}

function createImportResultFileCollection(sources: readonly ImportResultFileBatchView[]): ImportResultFileCollection {
  const count = sources.reduce((sum, source) => sum + source.count, 0)
  let activeSources = [...sources]
  let released = false
  return {
    get count() { assertAvailable(); return count },
    get released() { return released },
    release() {
      released = true
      activeSources = []
    },
    *[Symbol.iterator]() {
      assertAvailable()
      for (const source of activeSources) {
        for (let index = 0; index < source.count; index += 1) yield source.file(index)
      }
    },
  }

  function assertAvailable(): void {
    if (released) throw new Error("Коллекция файлов import освобождена")
  }
}

function createBoundedStateQueue(limit: number) {
  const pending: Array<() => Promise<void>> = []
  const active = new Set<Promise<void>>()
  const waiters = new Set<ReturnType<typeof Promise.withResolvers<void>>>()
  const failures: unknown[] = []
  return {
    run(task: () => Promise<void>): Promise<void> {
      if (failures.length === 0) pending.push(task)
      pump()
      return Promise.resolve()
    },
    async flush(): Promise<void> {
      if (pending.length > 0 || active.size > 0) {
        const waiter = Promise.withResolvers<void>()
        waiters.add(waiter)
        await waiter.promise
      }
      if (failures.length === 1) throw failures[0]
      if (failures.length > 1) throw new AggregateError(failures, workerFailureMessage(failures[0]))
    },
  }

  function pump(): void {
    while (failures.length === 0 && active.size < limit && pending.length > 0) {
      const task = pending.shift()!
      const running = Promise.resolve().then(task)
      active.add(running)
      void running.then(
        () => finish(running),
        (caught) => {
          failures.push(caught)
          pending.length = 0
          finish(running)
        },
      )
    }
    notifyIfIdle()
  }

  function finish(running: Promise<void>): void {
    active.delete(running)
    pump()
  }

  function notifyIfIdle(): void {
    if (pending.length > 0 || active.size > 0) return
    for (const waiter of waiters) waiter.resolve()
    waiters.clear()
  }
}

function normalizePendingStateBatches(value: number | undefined): number {
  const normalized = value ?? 2
  if (!Number.isSafeInteger(normalized) || normalized < 1) {
    throw new Error("Лимит неподтверждённых import state batches должен быть положительным целым числом")
  }
  return normalized
}

function secondPassBeginCommand(
  readToken: ProjectStateReadToken,
  composition: readonly ImportControlCompositionEntry[],
  exportProfile: XmlComponentExportProfile | undefined,
): Extract<ImportWorkerCommand, { kind: "beginSecondPass" }> {
  if (exportProfile === undefined) {
    throw new Error("Второй проход import не получил профиль восстановления XML")
  }
  return { kind: "beginSecondPass", readToken, composition, exportProfile }
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
    ? join(dirname(currentFile), "../composition/workers/importFromXml.ts")
    : join(dirname(currentFile), "importFromXmlWorker.js")
  const execArgv = currentFile.endsWith(".ts") ? sourceWorkerExecArgv() : []
  return new Piscina({
    filename: workerFile,
    minThreads: 1,
    maxThreads: 1,
    execArgv,
    // Один worker удерживает свою долю смыслового YAML между проходами, а во
    // втором проходе создаёт временные XML-деревья. Без границы V8 расширяет
    // каждую независимую кучу почти до общего системного предела и слишком
    // поздно собирает уже недостижимые деревья.
    resourceLimits: { maxOldGenerationSizeMb: 768 },
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
