import { parentPort, workerData, type MessagePort } from "node:worker_threads"
import type { SqliteFirstPassExperimentStats } from "./sqliteFirstPassExperimentProtocol"
import {
  type SqliteFirstPassExperimentProducerProfile,
  type SqliteFirstPassProducerMessage,
  type SqliteFirstPassStoreMessage,
} from "./sqliteFirstPassExperimentProducer"
import { createSqliteFirstPassExperimentStore } from "./sqliteFirstPassExperimentStore"

interface WorkerInput {
  readonly ports: MessagePort[]
}

type WorkerResultMessage =
  | { readonly kind: "completed"; readonly stats: SqliteFirstPassExperimentStats }
  | { readonly kind: "failed"; readonly message: string }

const input = workerData as WorkerInput
const store = createSqliteFirstPassExperimentStore()
const profiles = new Map<MessagePort, SqliteFirstPassExperimentProducerProfile>()
let settled = false

for (const port of input.ports) {
  port.on("message", (message: SqliteFirstPassProducerMessage) => {
    if (settled) return
    try {
      if (message.kind === "append") {
        store.append(message.records)
        port.postMessage({ kind: "ack", batchId: message.batchId } satisfies SqliteFirstPassStoreMessage)
        return
      }
      profiles.set(port, message.profile)
      port.close()
      if (profiles.size === input.ports.length) complete()
    } catch (caught) {
      fail(caught)
    }
  })
}

parentPort?.on("message", (message: { kind: string; message?: string }) => {
  if (message.kind === "abort") fail(new Error(message.message ?? "SQLite experiment aborted"))
})

function complete(): void {
  const storeStats = store.finalize()
  const producerProfiles = [...profiles.values()]
  const producerPayloadBytes = producerProfiles.reduce(
    (total, profile) => total + profile.payloadBytes,
    0,
  )
  if (producerPayloadBytes !== storeStats.payloadBytes) {
    throw new Error(
      `SQLite payload mismatch: producers=${producerPayloadBytes}, store=${storeStats.payloadBytes}`,
    )
  }
  settled = true
  parentPort?.postMessage({
    kind: "completed",
    stats: {
      ...storeStats,
      batches: producerProfiles.reduce((total, profile) => total + profile.batches, 0),
      producerWaitMs: producerProfiles.reduce(
        (total, profile) => total + profile.producerWaitMs,
        0,
      ),
      maxInFlightBatches: Math.max(
        0,
        ...producerProfiles.map((profile) => profile.maxInFlightBatches),
      ),
    },
  } satisfies WorkerResultMessage)
  parentPort?.close()
}

function fail(caught: unknown): void {
  if (settled) return
  settled = true
  const error = caught instanceof Error ? caught : new Error(String(caught))
  store.abort()
  for (const port of input.ports) {
    port.postMessage({ kind: "failed", message: error.message } satisfies SqliteFirstPassStoreMessage)
    port.close()
  }
  parentPort?.postMessage({ kind: "failed", message: error.message } satisfies WorkerResultMessage)
  parentPort?.close()
}
