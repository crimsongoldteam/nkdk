import { MessageChannel, type MessagePort } from "node:worker_threads"
import { describe, expect, it } from "vitest"
import { encodeSqliteFirstPassExperimentFile } from "./sqliteFirstPassExperimentProtocol"
import {
  createSqliteFirstPassExperimentProducer,
  type SqliteFirstPassProducerMessage,
} from "./sqliteFirstPassExperimentProducer"

function record(path: string) {
  return encodeSqliteFirstPassExperimentFile({
    componentPath: "cf",
    rootProjectPath: path,
    contributedFacts: true,
    diagnostics: [],
    objectRecords: [{ path }],
    objectIndexEntries: [],
    memberIndexEntries: [],
    valueIndexEntries: [],
    pendingReferences: [],
    pendingChecks: [],
  })
}

function collectMessages(port: MessagePort): {
  messages: SqliteFirstPassProducerMessage[]
  waitForLength(length: number): Promise<void>
} {
  const messages: SqliteFirstPassProducerMessage[] = []
  const waiters = new Set<() => void>()
  port.on("message", (message: SqliteFirstPassProducerMessage) => {
    messages.push(message)
    for (const resolve of waiters) resolve()
    waiters.clear()
  })
  return {
    messages,
    async waitForLength(length) {
      while (messages.length < length) {
        await new Promise<void>((resolve) => waiters.add(resolve))
      }
    },
  }
}

describe("SQLite first-pass experiment producer", () => {
  it("does not send a third batch before an acknowledgement", async () => {
    const channel = new MessageChannel()
    const received = collectMessages(channel.port2)
    const producer = createSqliteFirstPassExperimentProducer(channel.port1, {
      maxBatchBytes: 1,
      maxInFlight: 2,
    })

    await producer.append(record("cf/A.yaml"))
    await producer.append(record("cf/B.yaml"))
    await received.waitForLength(2)

    const third = producer.append(record("cf/C.yaml"))
    await new Promise<void>((resolve) => setImmediate(resolve))
    expect(
      received.messages.filter(({ kind }) => kind === "append"),
    ).toHaveLength(2)

    channel.port2.postMessage({ kind: "ack", batchId: 1 })
    await third
    await received.waitForLength(3)
    expect(
      received.messages
        .filter((message) => message.kind === "append")
        .map(({ batchId }) => batchId),
    ).toEqual([1, 2, 3])

    channel.port2.postMessage({ kind: "ack", batchId: 2 })
    channel.port2.postMessage({ kind: "ack", batchId: 3 })
    const profile = await producer.finish()
    await received.waitForLength(4)
    expect(received.messages[3]).toMatchObject({ kind: "finish" })
    expect(profile).toMatchObject({
      batches: 3,
      maxInFlightBatches: 2,
    })
    expect(profile.payloadBytes).toBeGreaterThan(0)
    channel.port2.close()
  })
})
