import { performance } from "node:perf_hooks"
import type { MessagePort } from "node:worker_threads"
import {
  SQLITE_FIRST_PASS_EXPERIMENT_BATCH_BYTES,
  SQLITE_FIRST_PASS_EXPERIMENT_MAX_IN_FLIGHT,
  type SqliteFirstPassExperimentFileRecord,
} from "./sqliteFirstPassExperimentProtocol"

export interface SqliteFirstPassExperimentProducerProfile {
  readonly batches: number
  readonly payloadBytes: number
  readonly producerWaitMs: number
  readonly maxInFlightBatches: number
}

export type SqliteFirstPassProducerMessage =
  | {
      readonly kind: "append"
      readonly batchId: number
      readonly bytes: number
      readonly records: readonly SqliteFirstPassExperimentFileRecord[]
    }
  | {
      readonly kind: "finish"
      readonly profile: SqliteFirstPassExperimentProducerProfile
    }

export type SqliteFirstPassStoreMessage =
  | { readonly kind: "ack"; readonly batchId: number }
  | { readonly kind: "failed"; readonly message: string }

export interface SqliteFirstPassExperimentProducer {
  append(record: SqliteFirstPassExperimentFileRecord): Promise<void>
  finish(): Promise<SqliteFirstPassExperimentProducerProfile>
}

interface ProducerOptions {
  readonly maxBatchBytes?: number
  readonly maxInFlight?: number
}

interface ChangeWaiter {
  resolve(): void
  reject(cause: Error): void
}

export function createSqliteFirstPassExperimentProducer(
  port: MessagePort,
  options: ProducerOptions = {},
): SqliteFirstPassExperimentProducer {
  const maxBatchBytes = options.maxBatchBytes ?? SQLITE_FIRST_PASS_EXPERIMENT_BATCH_BYTES
  const maxInFlight = options.maxInFlight ?? SQLITE_FIRST_PASS_EXPERIMENT_MAX_IN_FLIGHT
  if (maxBatchBytes <= 0) throw new Error("maxBatchBytes must be positive")
  if (maxInFlight <= 0) throw new Error("maxInFlight must be positive")

  let pending: SqliteFirstPassExperimentFileRecord[] = []
  let pendingBytes = 0
  let batchId = 0
  let batches = 0
  let payloadBytes = 0
  let producerWaitMs = 0
  let maxInFlightBatches = 0
  let failure: Error | undefined
  let finished = false
  let operation = Promise.resolve()
  const inFlight = new Set<number>()
  const waiters = new Set<ChangeWaiter>()

  port.on("message", (message: SqliteFirstPassStoreMessage) => {
    if (message.kind === "failed") {
      failure = new Error(message.message)
      notifyWaiters(failure)
      return
    }
    if (inFlight.delete(message.batchId)) notifyWaiters()
  })

  async function waitForChange(): Promise<void> {
    if (failure !== undefined) throw failure
    await new Promise<void>((resolve, reject) => waiters.add({ resolve, reject }))
    if (failure !== undefined) throw failure
  }

  function notifyWaiters(cause?: Error): void {
    for (const waiter of waiters) {
      if (cause === undefined) waiter.resolve()
      else waiter.reject(cause)
    }
    waiters.clear()
  }

  async function flush(): Promise<void> {
    if (pending.length === 0) return
    const waitStartedAt = performance.now()
    while (inFlight.size >= maxInFlight) await waitForChange()
    producerWaitMs += performance.now() - waitStartedAt
    if (failure !== undefined) throw failure

    const records = pending
    const bytes = pendingBytes
    pending = []
    pendingBytes = 0
    batchId += 1
    batches += 1
    payloadBytes += bytes
    inFlight.add(batchId)
    maxInFlightBatches = Math.max(maxInFlightBatches, inFlight.size)
    port.postMessage(
      { kind: "append", batchId, bytes, records } satisfies SqliteFirstPassProducerMessage,
      records.flatMap(recordTransferList),
    )
  }

  return {
    append(record) {
      if (finished) return Promise.reject(new Error("SQLite first-pass producer is finished"))
      operation = operation.then(async () => {
        if (failure !== undefined) throw failure
        if (pending.length > 0 && pendingBytes + record.bytes > maxBatchBytes) {
          await flush()
        }
        pending.push(record)
        pendingBytes += record.bytes
        if (pendingBytes >= maxBatchBytes) await flush()
      })
      return operation
    },
    async finish() {
      if (finished) throw new Error("SQLite first-pass producer is finished")
      finished = true
      await operation
      await flush()
      const waitStartedAt = performance.now()
      while (inFlight.size > 0) await waitForChange()
      producerWaitMs += performance.now() - waitStartedAt
      if (failure !== undefined) throw failure
      const profile = {
        batches,
        payloadBytes,
        producerWaitMs,
        maxInFlightBatches,
      }
      port.postMessage({ kind: "finish", profile } satisfies SqliteFirstPassProducerMessage)
      port.close()
      return profile
    },
  }
}

function recordTransferList(
  record: SqliteFirstPassExperimentFileRecord,
): ArrayBuffer[] {
  return [
    record.diagnostics.buffer,
    record.objectRecords.buffer,
    record.objectIndexEntries.buffer,
    record.memberIndexEntries.buffer,
    record.valueIndexEntries.buffer,
    record.pendingReferences.buffer,
    record.pendingChecks.buffer,
  ] as ArrayBuffer[]
}
