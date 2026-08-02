import { randomUUID } from "node:crypto"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { Worker } from "node:worker_threads"
import { sourceWorkerExecArgv } from "../sourceWorkerRuntime"
import { createProjectStateCompatibility, type ProjectStateCompatibility } from "./compatibility"
import type { ProjectStateFileUpdateBatch } from "./fileUpdate"
import type { Diagnostic } from "../validation/types"
import type { ProjectStateFileHashBatch, ProjectStateReadToken } from "./contracts"
import type { ProjectStateComponentProjection, ProjectStateFileChanges } from "./store"
import {
  assertProjectStateWriterBatch,
  type ProjectStateWriterAcknowledgement,
  type ProjectStateWriterCommand,
  type ProjectStateWriterResponse,
} from "./writerProtocol"

const DEFAULT_MAX_IN_FLIGHT_BATCHES = 2

export class ProjectStateWriterCancelledError extends Error {
  constructor() {
    super("Обновление состояния проекта отменено")
    this.name = "ProjectStateWriterCancelledError"
  }
}

export class ProjectStateWriterClosedError extends Error {
  constructor() {
    super("ProjectState writer закрыт")
    this.name = "ProjectStateWriterClosedError"
  }
}

export interface CreateProjectStateWriterHandleOptions {
  readonly compatibility?: ProjectStateCompatibility
  readonly maxInFlightBatches?: number
  readonly signal?: AbortSignal
  readonly workerData?: { readonly writeDelayMs?: number; readonly crashAfterCommit?: boolean }
}

export interface ProjectStateWriterHandle {
  openProject(projectDir: string): Promise<void>
  compareFiles(batch: ProjectStateFileHashBatch): Promise<ProjectStateFileChanges>
  readLocalDiagnostics(): Promise<readonly Diagnostic[]>
  createReadToken(): Promise<ProjectStateReadToken>
  readComponentProjection(componentPath: string): Promise<ProjectStateComponentProjection>
  beginUpdate(projectDir: string, signal?: AbortSignal): Promise<void>
  writeBatch(batch: ProjectStateFileUpdateBatch): Promise<void>
  deleteFiles(projectPaths: readonly string[]): Promise<void>
  commitAndCheckpoint(): Promise<{ readonly snapshotPath: string }>
  rollbackUpdate(): Promise<void>
  reset(projectDir: string): Promise<void>
  close(): Promise<void>
}

interface PendingRequest {
  readonly resolve: (result: ProjectStateWriterAcknowledgement) => void
  readonly reject: (caught: unknown) => void
  readonly batch: boolean
}

interface QueuedBatch {
  readonly batch: ProjectStateFileUpdateBatch
  readonly resolve: () => void
  readonly reject: (caught: unknown) => void
}

export function createProjectStateWriterHandle(
  options: CreateProjectStateWriterHandleOptions = {},
): ProjectStateWriterHandle {
  const compatibility = options.compatibility ?? createProjectStateCompatibility()
  const maxInFlight = options.maxInFlightBatches ?? DEFAULT_MAX_IN_FLIGHT_BATCHES
  if (!Number.isSafeInteger(maxInFlight) || maxInFlight < 1) {
    throw new Error("Размер очереди ProjectState writer должен быть положительным целым числом")
  }
  const worker = createWorker(options.workerData)
  const pending = new Map<string, PendingRequest>()
  const queuedBatches: QueuedBatch[] = []
  const operationWrites = new Set<Promise<void>>()
  let inFlightBatches = 0
  let openedProjectDir: string | undefined
  let operationId: string | undefined
  let cancelledError: ProjectStateWriterCancelledError | undefined
  let cancellation: Promise<void> | undefined
  let operationFailure: unknown
  let irreversibleCommit = false
  let operationSignal: AbortSignal | undefined
  let fatalError: Error | undefined
  let closing = false
  let closePromise: Promise<void> | undefined

  worker.on("message", receive)
  worker.once("error", failWorker)
  worker.once("exit", (code) => {
    if (!closing) failWorker(new Error(`ProjectState writer worker неожиданно завершился с кодом ${code}`))
    else if (pending.size > 0) rejectOutstanding(new ProjectStateWriterClosedError())
  })

  const handle: ProjectStateWriterHandle = {
    async openProject(projectDir) {
      assertUsable()
      if (openedProjectDir === projectDir) return
      if (operationId !== undefined) throw new Error("Нельзя сменить проект во время обновления состояния")
      await request({ kind: "openProject", requestId: randomUUID(), projectDir, compatibility })
      openedProjectDir = projectDir
    },
    async compareFiles(batch) {
      assertUsable()
      const result = await request({ kind: "compareFiles", requestId: randomUUID(), batch })
      if (result.kind !== "filesCompared") throw new Error("ProjectState writer не вернул сравнение файлов")
      return result.changes
    },
    async readLocalDiagnostics() {
      assertUsable()
      const result = await request({ kind: "readLocalDiagnostics", requestId: randomUUID() })
      if (result.kind !== "localDiagnostics") throw new Error("ProjectState writer не вернул локальные diagnostics")
      return result.diagnostics
    },
    async createReadToken() {
      assertUsable()
      const result = await request({ kind: "createReadToken", requestId: randomUUID() })
      if (result.kind !== "readToken") throw new Error("ProjectState writer не вернул read token")
      return result.token
    },
    async readComponentProjection(componentPath) {
      assertUsable()
      const result = await request({ kind: "readComponentProjection", requestId: randomUUID(), componentPath })
      if (result.kind !== "componentProjection") throw new Error("ProjectState writer не вернул проекцию компонента")
      return result.projection
    },
    async beginUpdate(projectDir, signal) {
      assertUsable()
      const nextSignal = signal ?? options.signal
      if (nextSignal?.aborted === true) throw cancellationError()
      await handle.openProject(projectDir)
      if (isAbortSignalAborted(nextSignal)) throw cancellationError()
      if (operationId !== undefined) throw new Error("Обновление состояния проекта уже начато")
      const nextOperationId = randomUUID()
      await request({ kind: "beginUpdate", requestId: randomUUID(), operationId: nextOperationId })
      operationId = nextOperationId
      operationFailure = undefined
      cancelledError = undefined
      cancellation = undefined
      operationSignal = nextSignal
      operationSignal?.addEventListener("abort", cancelOperation, { once: true })
      if (operationSignal?.aborted === true) cancelOperation()
    },
    writeBatch(batch) {
      try {
        assertUsable()
        assertActiveOperation()
        assertProjectStateWriterBatch(batch)
        if (cancelledError !== undefined) return Promise.reject(cancelledError)
      } catch (caught) {
        return Promise.reject(caught)
      }
      let resolveWrite!: () => void
      let rejectWrite!: (caught: unknown) => void
      const result = new Promise<void>((resolve, reject) => {
        resolveWrite = resolve
        rejectWrite = reject
      })
      queuedBatches.push({ batch, resolve: resolveWrite, reject: rejectWrite })
      operationWrites.add(result)
      void result.then(
        () => operationWrites.delete(result),
        (caught) => {
          operationWrites.delete(result)
          operationFailure ??= caught
        },
      )
      drainBatches()
      return result
    },
    async deleteFiles(projectPaths) {
      assertUsable()
      const currentOperationId = assertActiveOperation()
      if (cancelledError !== undefined) throw cancelledError
      await request({ kind: "deleteFiles", requestId: randomUUID(), operationId: currentOperationId, projectPaths })
    },
    async commitAndCheckpoint() {
      assertUsable()
      if (cancelledError !== undefined) {
        await cancellation
        operationId = undefined
        clearOperationSignal()
        throw cancelledError
      }
      const currentOperationId = assertActiveOperation()
      await Promise.all([...operationWrites])
      if (operationFailure !== undefined) throw operationFailure
      if (cancelledError !== undefined) {
        await cancellation
        operationId = undefined
        clearOperationSignal()
        throw cancelledError
      }
      irreversibleCommit = true
      let committed = false
      try {
        await request({ kind: "commitUpdate", requestId: randomUUID(), operationId: currentOperationId })
        committed = true
        const result = await request({ kind: "checkpoint", requestId: randomUUID() })
        operationId = undefined
        if (result.kind !== "checkpointed") throw new Error("ProjectState writer не подтвердил checkpoint")
        return { snapshotPath: result.snapshotPath }
      } catch (caught) {
        if (committed) await restoreAfterFailedCheckpoint()
        throw caught
      } finally {
        irreversibleCommit = false
        clearOperationSignal()
      }
    },
    async rollbackUpdate() {
      assertUsable()
      await cancellation?.catch(() => undefined)
      if (operationId === undefined) return
      const currentOperationId = assertActiveOperation()
      await Promise.allSettled([...operationWrites])
      await request({ kind: "rollbackUpdate", requestId: randomUUID(), operationId: currentOperationId })
      operationId = undefined
      clearOperationSignal()
    },
    async reset(projectDir) {
      assertUsable()
      if (operationId !== undefined) throw new Error("Нельзя сбросить состояние во время обновления")
      await request({ kind: "reset", requestId: randomUUID(), projectDir })
      openedProjectDir = projectDir
    },
    close() {
      if (closePromise !== undefined) return closePromise
      closing = true
      clearOperationSignal()
      rejectOutstanding(new ProjectStateWriterClosedError())
      closePromise = closeWorker()
      return closePromise
    },
  }
  return handle

  function request(command: ProjectStateWriterCommand, transfer: readonly ArrayBuffer[] = []): Promise<ProjectStateWriterAcknowledgement> {
    assertUsableForRequest(command.kind)
    return new Promise((resolve, reject) => {
      const batch = command.kind === "writeBatch"
      pending.set(command.requestId, { resolve, reject, batch })
      try {
        worker.postMessage(command, transfer)
      } catch (caught) {
        pending.delete(command.requestId)
        if (batch) {
          inFlightBatches -= 1
          drainBatches()
        }
        reject(caught)
      }
    })
  }

  function receive(response: ProjectStateWriterResponse): void {
    const waiter = pending.get(response.requestId)
    if (waiter === undefined) return
    pending.delete(response.requestId)
    if (waiter.batch) {
      inFlightBatches -= 1
      drainBatches()
    }
    if (response.kind === "failed") {
      const error = new Error(response.error.message)
      error.name = response.error.name
      waiter.reject(error)
    } else {
      waiter.resolve(response.result)
    }
  }

  function drainBatches(): void {
    if (cancelledError !== undefined || fatalError !== undefined || closing) return
    while (inFlightBatches < maxInFlight && queuedBatches.length > 0) {
      const queued = queuedBatches.shift()!
      try {
        assertProjectStateWriterBatch(queued.batch)
        const currentOperationId = assertActiveOperation()
        inFlightBatches += 1
        void request(
          { kind: "writeBatch", requestId: randomUUID(), operationId: currentOperationId, batch: queued.batch },
          [queued.batch.hashBytes.buffer as ArrayBuffer],
        ).then(() => queued.resolve(), queued.reject)
      } catch (caught) {
        queued.reject(caught)
      }
    }
  }

  function cancelOperation(): void {
    if (
      operationId === undefined ||
      cancelledError !== undefined ||
      fatalError !== undefined ||
      irreversibleCommit
    )
      return
    const currentOperationId = operationId
    cancelledError = cancellationError()
    for (const queued of queuedBatches.splice(0)) queued.reject(cancelledError)
    for (const [requestId, waiter] of pending) {
      if (!waiter.batch) continue
      pending.delete(requestId)
      inFlightBatches -= 1
      waiter.reject(cancelledError)
    }
    cancellation = request({
      kind: "cancelOperation",
      requestId: randomUUID(),
      operationId: currentOperationId,
    }).then(() => {
      if (operationId !== currentOperationId) return
      operationId = undefined
      clearOperationSignal()
    })
    void cancellation.catch(() => undefined)
  }

  function failWorker(caught: Error): void {
    if (fatalError !== undefined) return
    fatalError = caught
    rejectOutstanding(caught)
  }

  function rejectOutstanding(caught: Error): void {
    for (const queued of queuedBatches.splice(0)) queued.reject(caught)
    for (const waiter of pending.values()) waiter.reject(caught)
    pending.clear()
    inFlightBatches = 0
  }

  async function closeWorker(): Promise<void> {
    if (fatalError === undefined) {
      try {
        await request({ kind: "close", requestId: randomUUID() })
      } catch {
        // Worker уже мог завершиться после подтверждённой аварии.
      }
    }
    await worker.terminate()
  }

  async function restoreAfterFailedCheckpoint(): Promise<void> {
    const currentProjectDir = openedProjectDir
    operationId = undefined
    operationFailure = undefined
    if (currentProjectDir === undefined) throw new Error("ProjectState writer потерял открытый проект")
    await request({
      kind: "openProject",
      requestId: randomUUID(),
      projectDir: currentProjectDir,
      compatibility,
    })
  }

  function assertActiveOperation(): string {
    if (operationId === undefined) throw new Error("Нет активного обновления состояния проекта")
    return operationId
  }

  function assertUsable(): void {
    if (fatalError !== undefined) throw fatalError
    if (closing) throw new Error("ProjectState writer закрыт")
  }

  function assertUsableForRequest(kind: ProjectStateWriterCommand["kind"]): void {
    if (fatalError !== undefined) throw fatalError
    if (closing && kind !== "close") throw new Error("ProjectState writer закрыт")
  }

  function cancellationError(): ProjectStateWriterCancelledError {
    return cancelledError ?? new ProjectStateWriterCancelledError()
  }

  function clearOperationSignal(): void {
    operationSignal?.removeEventListener("abort", cancelOperation)
    operationSignal = undefined
  }
}

function isAbortSignalAborted(signal: AbortSignal | undefined): boolean {
  return signal?.aborted === true
}

function createWorker(workerData: CreateProjectStateWriterHandleOptions["workerData"]): Worker {
  const currentFile = fileURLToPath(import.meta.url)
  const workerFile = currentFile.endsWith(".ts")
    ? join(dirname(currentFile), "writerWorker.ts")
    : join(dirname(currentFile), "projectStateWriterWorker.js")
  return new Worker(workerFile, {
    execArgv: currentFile.endsWith(".ts") ? sourceWorkerExecArgv() : [],
    workerData,
  })
}
