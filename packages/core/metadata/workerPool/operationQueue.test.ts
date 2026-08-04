import { describe, expect, it } from "vitest"
import { runMetadataWorkerOperationQueue } from "./operationQueue"
import type { MetadataWorkerBinaryResult } from "./binaryResult"
import type {
  MetadataWorkerOperation,
  MetadataWorkerOperationCommand,
} from "./types"

describe("очередь операций универсальных worker", () => {
  it("выдаёт следующую пачку свободной линии, не ожидая применения предыдущего результата", async () => {
    const delayedAccept = Promise.withResolvers<void>()
    const nextRun = Promise.withResolvers<void>()
    const events: string[] = []
    const accepted: { batchId: number; workerIndex: number }[] = []
    const operation = fakeOperation(2, async (workerIndex, command) => {
      const batchId = Number(probeValue(command))
      events.push(`run:${workerIndex}:${batchId}`)
      if (batchId === 2) nextRun.resolve()
      return binaryResult(batchId)
    })

    const running = runMetadataWorkerOperationQueue({
      operation,
      tasks: [
        { batchId: 0, command: probe(0) },
        { batchId: 1, workerIndex: 1, command: probe(1) },
        { batchId: 2, workerIndex: 0, command: probe(2) },
      ],
      accept({ batchId, workerIndex }) {
        events.push(`accept:${workerIndex}:${batchId}`)
        accepted.push({ batchId, workerIndex })
        return batchId === 0 ? delayedAccept.promise : undefined
      },
    })

    await nextRun.promise
    expect(events).toContain("accept:0:0")
    delayedAccept.resolve()
    await running

    expect(events).toEqual(expect.arrayContaining([
      "run:0:0",
      "run:1:1",
      "run:0:2",
    ]))
    expect(accepted.sort((left, right) => left.batchId - right.batchId)).toEqual([
      { batchId: 0, workerIndex: 0 },
      { batchId: 1, workerIndex: 1 },
      { batchId: 2, workerIndex: 0 },
    ])
  })

  it("после первой ошибки больше не выдаёт новые пачки", async () => {
    const started: number[] = []
    const operation = fakeOperation(1, async (_workerIndex, command) => {
      const batchId = Number(probeValue(command))
      started.push(batchId)
      if (batchId === 0) throw new Error("worker failed")
      return binaryResult(batchId)
    })

    await expect(runMetadataWorkerOperationQueue({
      operation,
      tasks: [
        { batchId: 0, command: probe(0) },
        { batchId: 1, command: probe(1) },
      ],
      accept() {},
    })).rejects.toThrow("worker failed")
    expect(started).toEqual([0])
  })
})

function fakeOperation(
  concurrency: number,
  run: MetadataWorkerOperation["run"],
): MetadataWorkerOperation {
  return {
    id: "test",
    concurrency,
    run,
    async finish() {},
  }
}

function probe(batchId: number): MetadataWorkerOperationCommand {
  return { kind: "probe", value: String(batchId) }
}

function probeValue(command: MetadataWorkerOperationCommand): string {
  if (command.kind !== "probe") throw new Error("Ожидалась тестовая команда")
  return command.value
}

function binaryResult(batchId: number): MetadataWorkerBinaryResult {
  return {
    kind: "binaryResult",
    payloadKind: "test",
    counters: { batchId },
    buffers: [],
  }
}
