import { randomUUID } from "node:crypto"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { Worker } from "node:worker_threads"
import { sourceWorkerExecArgv } from "../sourceWorkerRuntime"
import { createProjectStateCompatibility, type ProjectStateCompatibility } from "./compatibility"
import { assertProjectStateFileUpdateBatch, type ProjectStateFileUpdateBatch } from "./fileUpdate"
import type {
  ProjectStateWriterAcknowledgement,
  ProjectStateWriterCommand,
  ProjectStateWriterResponse,
} from "./writerProtocol"

const DEFAULT_MAX_IN_FLIGHT_BATCHES = 2

export class ProjectStateWriterCancelledError extends Error {
  constructor() {
    super("Обновление состояния проекта отменено")
    this.name = "ProjectStateWriterCancelledError"
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
  beginUpdate(projectDir: string): Promise<void>
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
  let fatalError: Error | undefined
  let closing = false

  worker.on("message", receive)
  worker.once("error", failWorker)
  worker.once("exit", (code) => {
    if (!closing && code !== 0) failWorker(new Error(`ProjectState writer worker завершился с кодом ${code}`))
  })
  options.signal?.addEventListener("abort", cancelOperation, { once: true })

  const handle: ProjectStateWriterHandle = {
    async openProject(projectDir) {
      assertUsable()
      if (openedProjectDir === projectDir) return
      if (operationId !== undefined) throw new Error("Нельзя сменить проект во время обновления состояния")
      await request({ kind: "openProject", requestId: randomUUID(), projectDir, compatibility })
      openedProjectDir = projectDir
    },
    async beginUpdate(projectDir) {
      assertUsable()
      if (isAborted()) throw cancellationError()
      await handle.openProject(projectDir)
      if (operationId !== undefined) throw new Error("Обновление состояния проекта уже начато")
      const nextOperationId = randomUUID()
      await request({ kind: "beginUpdate", requestId: randomUUID(), operationId: nextOperationId })
      operationId = nextOperationId
      operationFailure = undefined
      cancelledError = undefined
      cancellation = undefined
      if (isAborted()) cancelOperation()
    },
    writeBatch(batch) {
      try {
        assertUsable()
        assertActiveOperation()
        assertProjectStateFileUpdateBatch(batch)
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
      const currentOperationId = assertActiveOperation()
      if (cancelledError !== undefined) {
        await cancellation
        throw cancelledError
      }
      await Promise.all([...operationWrites])
      if (operationFailure !== undefined) throw operationFailure
      await request({ kind: "commitUpdate", requestId: randomUUID(), operationId: currentOperationId })
      const result = await request({ kind: "checkpoint", requestId: randomUUID() })
      operationId = undefined
      if (result.kind !== "checkpointed") throw new Error("ProjectState writer не подтвердил checkpoint")
      return { snapshotPath: result.snapshotPath }
    },
    async rollbackUpdate() {
      assertUsable()
      const currentOperationId = assertActiveOperation()
      await Promise.allSettled([...operationWrites])
      await request({ kind: "rollbackUpdate", requestId: randomUUID(), operationId: currentOperationId })
      operationId = undefined
    },
    async reset(projectDir) {
      assertUsable()
      if (operationId !== undefined) throw new Error("Нельзя сбросить состояние во время обновления")
      await request({ kind: "reset", requestId: randomUUID(), projectDir })
      openedProjectDir = projectDir
    },
    async close() {
      if (closing) return
      closing = true
      options.signal?.removeEventListener("abort", cancelOperation)
      if (fatalError === undefined) {
        try {
          await request({ kind: "close", requestId: randomUUID() })
        } catch {
          // Worker уже мог завершиться после подтверждённой аварии.
        }
      }
      await worker.terminate()
    },
  }
  return handle

  function request(command: ProjectStateWriterCommand, transfer: readonly ArrayBuffer[] = []): Promise<ProjectStateWriterAcknowledgement> {
    assertUsableForRequest(command.kind)
    return new Promise((resolve, reject) => {
      pending.set(command.requestId, { resolve, reject, batch: command.kind === "writeBatch" })
      worker.postMessage(command, transfer)
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
        assertProjectStateFileUpdateBatch(queued.batch)
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
    if (operationId === undefined || cancelledError !== undefined || fatalError !== undefined) return
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
    }).then(() => undefined)
    void cancellation.catch(() => undefined)
  }

  function failWorker(caught: Error): void {
    if (fatalError !== undefined) return
    fatalError = caught
    for (const queued of queuedBatches.splice(0)) queued.reject(caught)
    for (const waiter of pending.values()) waiter.reject(caught)
    pending.clear()
    inFlightBatches = 0
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

  function isAborted(): boolean {
    return options.signal?.aborted === true
  }
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
