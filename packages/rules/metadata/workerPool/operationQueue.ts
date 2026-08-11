import {
  assertMetadataWorkerBinaryResult,
  type MetadataWorkerBinaryResult,
} from "./binaryResult"
import type {
  MetadataWorkerOperation,
  MetadataWorkerOperationCommand,
} from "./types"

export interface MetadataWorkerQueuedTask {
  readonly batchId: number
  readonly command: MetadataWorkerOperationCommand
  readonly workerIndex?: number
}

export interface RunMetadataWorkerOperationQueueParams {
  readonly operation: MetadataWorkerOperation
  readonly tasks: AsyncIterable<MetadataWorkerQueuedTask> | Iterable<MetadataWorkerQueuedTask>
  readonly signal?: AbortSignal
  accept(params: {
    readonly batchId: number
    readonly workerIndex: number
    readonly result: MetadataWorkerBinaryResult
  }): void | Promise<void>
}

const RETRY = Symbol("retry")

export async function runMetadataWorkerOperationQueue(
  params: RunMetadataWorkerOperationQueueParams,
): Promise<void> {
  const iterator = asyncIterator(params.tasks)
  const pending: MetadataWorkerQueuedTask[] = []
  const batchIds = new Set<number>()
  const acceptPromises: Promise<void>[] = []
  let iteratorDone = false
  let stopped = false
  let failure: unknown
  let takeLock = Promise.resolve()

  function stop(caught: unknown): void {
    if (failure === undefined) failure = caught
    stopped = true
  }

  async function take(workerIndex: number): Promise<MetadataWorkerQueuedTask | typeof RETRY | undefined> {
    const result = takeLock.then(() => takeUnlocked(workerIndex))
    takeLock = result.then(() => undefined, () => undefined)
    return result
  }

  async function takeUnlocked(workerIndex: number): Promise<MetadataWorkerQueuedTask | typeof RETRY | undefined> {
    if (stopped) return undefined
    params.signal?.throwIfAborted()
    const pendingIndex = pending.findIndex((task) => task.workerIndex === undefined || task.workerIndex === workerIndex)
    if (pendingIndex >= 0) return pending.splice(pendingIndex, 1)[0]
    if (iteratorDone) return pending.length === 0 ? undefined : RETRY

    const next = await iterator.next()
    if (next.done) {
      iteratorDone = true
      return pending.length === 0 ? undefined : RETRY
    }
    assertTask(next.value, params.operation.concurrency, batchIds)
    if (next.value.workerIndex === undefined || next.value.workerIndex === workerIndex) return next.value
    pending.push(next.value)
    return RETRY
  }

  async function runLine(workerIndex: number): Promise<void> {
    while (!stopped) {
      let task: MetadataWorkerQueuedTask | typeof RETRY | undefined
      try {
        task = await take(workerIndex)
      } catch (caught) {
        stop(caught)
        return
      }
      if (task === undefined) return
      if (task === RETRY) {
        await Promise.resolve()
        continue
      }

      try {
        params.signal?.throwIfAborted()
        const result = await params.operation.run(workerIndex, task.command)
        params.signal?.throwIfAborted()
        assertMetadataWorkerBinaryResult(result)
        const accepted = params.accept({ batchId: task.batchId, workerIndex, result })
        if (accepted !== undefined) {
          const promise = Promise.resolve(accepted).catch((caught) => {
            stop(caught)
            throw caught
          })
          acceptPromises.push(promise)
        }
      } catch (caught) {
        stop(caught)
        return
      }
    }
  }

  await Promise.all(Array.from(
    { length: params.operation.concurrency },
    (_, workerIndex) => runLine(workerIndex),
  ))
  const acceptance = await Promise.allSettled(acceptPromises)
  if (failure === undefined) {
    const rejected = acceptance.find((result): result is PromiseRejectedResult => result.status === "rejected")
    if (rejected !== undefined) failure = rejected.reason
  }
  if (failure !== undefined) {
    await iterator.return?.()
    throw failure
  }
}

function assertTask(
  task: MetadataWorkerQueuedTask,
  concurrency: number,
  batchIds: Set<number>,
): void {
  if (!Number.isSafeInteger(task.batchId) || task.batchId < 0) {
    throw new Error("Идентификатор рабочей пачки должен быть неотрицательным целым числом")
  }
  if (batchIds.has(task.batchId)) throw new Error(`Рабочая пачка ${task.batchId} указана повторно`)
  if (task.workerIndex !== undefined && (
    !Number.isSafeInteger(task.workerIndex) || task.workerIndex < 0 || task.workerIndex >= concurrency
  )) throw new Error(`Индекс worker ${task.workerIndex} выходит за пределы операции`)
  batchIds.add(task.batchId)
}

function asyncIterator<T>(source: AsyncIterable<T> | Iterable<T>): AsyncIterator<T> {
  if (Symbol.asyncIterator in source) return source[Symbol.asyncIterator]()
  const iterator = source[Symbol.iterator]()
  return {
    next: async () => iterator.next(),
    return: iterator.return === undefined ? undefined : async () => iterator.return!(),
  }
}
