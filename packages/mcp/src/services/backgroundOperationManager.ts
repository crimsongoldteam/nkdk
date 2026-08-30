import type {
  BackgroundOperationInput,
  BackgroundOperationKind,
  BackgroundOperationResult,
  BackgroundOperationSnapshot,
  OperationAccepted,
} from "../contracts/backgroundOperations"
import type { BackgroundOperationStore } from "./backgroundOperationStore"

export interface BackgroundOperationReport {
  readonly stage: string
  readonly completed?: number
  readonly total?: number
  readonly unit?: string
  readonly message?: string
}

export interface BackgroundOperationRunner<K extends BackgroundOperationKind> {
  run(
    input: BackgroundOperationInput<K>,
    context: {
      readonly signal: AbortSignal
      report(update: BackgroundOperationReport): Promise<void>
    },
  ): Promise<BackgroundOperationResult<K>>
}

export type BackgroundOperationRunners = {
  readonly [K in BackgroundOperationKind]: BackgroundOperationRunner<K>
}

export interface BackgroundOperationManager {
  start<K extends BackgroundOperationKind>(
    kind: K,
    input: BackgroundOperationInput<K>,
  ): Promise<OperationAccepted>
  get(projectDir: string, operationId: string): Promise<BackgroundOperationSnapshot | undefined>
  cancel(projectDir: string, operationId: string): Promise<BackgroundOperationSnapshot | undefined>
  close(): Promise<void>
}

export function createBackgroundOperationManager(options: {
  readonly runners: BackgroundOperationRunners
  readonly store: BackgroundOperationStore
  readonly operationId: () => string
  readonly now: () => Date
}): BackgroundOperationManager {
  const snapshots = new Map<string, BackgroundOperationSnapshot>()
  const controllers = new Map<string, AbortController>()
  const jobs = new Map<string, Promise<void>>()
  const initializedProjects = new Map<string, Promise<void>>()
  let closed = false

  return { start, get, cancel, close }

  async function start<K extends BackgroundOperationKind>(
    kind: K,
    input: BackgroundOperationInput<K>,
  ): Promise<OperationAccepted> {
    if (closed) throw new Error("Диспетчер фоновых операций закрыт")
    await initializeProject(input.projectDir)
    const operationId = options.operationId()
    const timestamp = options.now().toISOString()
    const snapshot = operationSnapshot({
      status: "queued",
      operationId,
      operationKind: kind,
      projectDir: input.projectDir,
      createdAt: timestamp,
      updatedAt: timestamp,
      messages: [],
    })
    const key = operationKey(input.projectDir, operationId)
    const controller = new AbortController()
    snapshots.set(key, snapshot)
    controllers.set(key, controller)
    await options.store.write(snapshot)
    const job = Promise.resolve().then(() => execute(key, kind, input, controller))
    jobs.set(key, job)
    void job.finally(() => {
      jobs.delete(key)
      controllers.delete(key)
    })
    return { ok: true, status: "accepted", operationId, operationKind: kind, projectDir: input.projectDir }
  }

  async function execute<K extends BackgroundOperationKind>(
    key: string,
    kind: K,
    input: BackgroundOperationInput<K>,
    controller: AbortController,
  ): Promise<void> {
    if (controller.signal.aborted) return
    await replace(key, (current) => operationSnapshot({
      ...current,
      status: "running",
      updatedAt: options.now().toISOString(),
    }))
    try {
      const result = await options.runners[kind].run(input, {
        signal: controller.signal,
        report: (update) => report(key, update),
      })
      if (controller.signal.aborted) {
        await markCancelled(key)
        return
      }
      await replace(key, (current) => operationSnapshot({
        ...current,
        status: "succeeded",
        updatedAt: options.now().toISOString(),
        result,
      }))
    } catch (caught) {
      if (controller.signal.aborted || isAbortError(caught)) {
        await markCancelled(key)
        return
      }
      await replace(key, (current) => operationSnapshot({
        ...current,
        status: "failed",
        updatedAt: options.now().toISOString(),
        error: {
          code: "operation_failed",
          message: caught instanceof Error ? caught.message : String(caught),
        },
      }))
    }
  }

  async function report(key: string, update: BackgroundOperationReport): Promise<void> {
    await replace(key, (current) => operationSnapshot({
      ...current,
      updatedAt: options.now().toISOString(),
      stage: update.stage,
      ...(update.completed === undefined || update.total === undefined ? {} : {
        progress: {
          completed: update.completed,
          total: update.total,
          ...(update.unit === undefined ? {} : { unit: update.unit }),
        },
      }),
      messages: update.message === undefined ? current.messages : [...current.messages, update.message],
    }))
  }

  async function get(projectDir: string, operationId: string): Promise<BackgroundOperationSnapshot | undefined> {
    await initializeProject(projectDir)
    return snapshots.get(operationKey(projectDir, operationId)) ?? options.store.read(projectDir, operationId)
  }

  async function cancel(projectDir: string, operationId: string): Promise<BackgroundOperationSnapshot | undefined> {
    const current = await get(projectDir, operationId)
    if (current === undefined || isTerminal(current)) return current
    const key = operationKey(projectDir, operationId)
    controllers.get(key)?.abort()
    await markCancelled(key)
    return snapshots.get(key)
  }

  async function markCancelled(key: string): Promise<void> {
    const current = snapshots.get(key)
    if (current === undefined || current.status === "cancelled") return
    await replace(key, (snapshot) => operationSnapshot({
      ...snapshot,
      status: "cancelled",
      updatedAt: options.now().toISOString(),
    }))
  }

  async function replace(
    key: string,
    update: (current: BackgroundOperationSnapshot) => BackgroundOperationSnapshot,
  ): Promise<void> {
    const current = snapshots.get(key)
    if (current === undefined) throw new Error(`Фоновая операция не найдена: ${key}`)
    const next = update(current)
    snapshots.set(key, next)
    await options.store.write(next)
  }

  function initializeProject(projectDir: string): Promise<void> {
    let initialization = initializedProjects.get(projectDir)
    if (initialization === undefined) {
      initialization = options.store.recover(projectDir).then(() => options.store.cleanup(projectDir))
      initializedProjects.set(projectDir, initialization)
    }
    return initialization
  }

  async function close(): Promise<void> {
    if (closed) return
    closed = true
    for (const controller of controllers.values()) controller.abort()
    await Promise.allSettled(jobs.values())
  }
}

function operationSnapshot(value: object): BackgroundOperationSnapshot {
  return value as BackgroundOperationSnapshot
}

function operationKey(projectDir: string, operationId: string): string {
  return `${projectDir}\u0000${operationId}`
}

function isTerminal(snapshot: BackgroundOperationSnapshot): boolean {
  return snapshot.status !== "queued" && snapshot.status !== "running"
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError"
}
