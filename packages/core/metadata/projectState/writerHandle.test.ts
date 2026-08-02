import fs from "node:fs"
import { markAsUntransferable, Worker } from "node:worker_threads"
import { afterEach, describe, expect, it } from "vitest"
import type { ProjectStateCompatibility } from "./compatibility"
import { createProjectStateFileUpdateBatch, type ProjectStateFileUpdate } from "./fileUpdate"
import { sourceWorkerExecArgv } from "../sourceWorkerRuntime"
import { openPersistentSqliteProjectStateStore, projectStateSnapshotPath } from "./sqlite/persistence"
import { trackTempProjectDirs } from "./tests/tempProjectDir"
import {
  createProjectStateWriterHandle,
  ProjectStateWriterCancelledError,
  type ProjectStateWriterHandle,
} from "./writerHandle"
import type { ProjectStateWriterCommand, ProjectStateWriterResponse } from "./writerProtocol"

const compatibility: ProjectStateCompatibility = {
  schemaVersion: 1,
  producerVersion: "test",
  rulesFingerprint: "rules-a",
  hashAlgorithm: "xxhash64-be-v1",
}

describe("ProjectState writer handle", () => {
  const projectDirs = trackTempProjectDirs("nkdk-project-state-writer-")
  const createProjectDir = projectDirs.create
  const handles: ProjectStateWriterHandle[] = []

  afterEach(async () => {
    await Promise.all(handles.splice(0).map((handle) => handle.close().catch(() => undefined)))
    await projectDirs.removeAll()
  })

  function createHandle(options: Parameters<typeof createProjectStateWriterHandle>[0] = { compatibility }) {
    const handle = createProjectStateWriterHandle(options)
    handles.push(handle)
    return handle
  }

  it("последовательно подтверждает пачки, переносит общий буфер и публикует checkpoint", async () => {
    const projectDir = await createProjectDir()
    const handle = createHandle()
    await handle.beginUpdate(projectDir)
    const batches = [
      batch("cf/a.bin", 0x0102030405060708n),
      batch("cf/b.bin", 0x1112131415161718n),
      batch("cf/c.bin", 0x80818283848586ffn),
    ]

    await Promise.all(batches.map((value) => handle.writeBatch(value)))
    expect(batches.map((value) => value.hashBytes.byteLength)).toEqual([0, 0, 0])

    const result = await handle.commitAndCheckpoint()
    expect(result.snapshotPath).toBe(projectStateSnapshotPath(projectDir))

    const reopened = await openPersistentSqliteProjectStateStore({ projectDir, compatibility })
    const updates = [resource("cf/a.bin"), resource("cf/b.bin"), resource("cf/c.bin")]
    expect(reopened.store.compareFiles({
      files: updates.map(identity),
      hashBytes: Uint8Array.from([
        1, 2, 3, 4, 5, 6, 7, 8,
        0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18,
        0x80, 0x81, 0x82, 0x83, 0x84, 0x85, 0x86, 0xff,
      ]),
    })).toEqual({ changed: [], deleted: [] })
    reopened.store.close()
  })

  it.each([
    ["смещение", new Uint8Array(new ArrayBuffer(9), 1, 8), 9],
    ["длина представления", new Uint8Array(7), 7],
    ["длина backing buffer", new Uint8Array(new ArrayBuffer(9), 0, 8), 9],
  ])("отклоняет неверный общий буфер до postMessage: %s", async (_name, hashBytes, bufferLength) => {
    const projectDir = await createProjectDir()
    const handle = createHandle()
    await handle.beginUpdate(projectDir)
    const invalid = { updates: [resource("cf/a.bin")], hashBytes }

    await expect(handle.writeBatch(invalid)).rejects.toThrow("hashBytes")
    expect(hashBytes.buffer.byteLength).toBe(bufferLength)
    await handle.rollbackUpdate()
  })

  it("отклоняет SharedArrayBuffer до transfer и не блокирует следующую пачку", async () => {
    const projectDir = await createProjectDir()
    const handle = createHandle({ compatibility, maxInFlightBatches: 1 })
    await handle.beginUpdate(projectDir)
    const shared = {
      updates: [resource("cf/shared.bin")],
      hashBytes: new Uint8Array(new SharedArrayBuffer(8)),
    }

    await expect(handle.writeBatch(shared)).rejects.toThrow("ArrayBuffer")
    await expect(settleWithin(handle.writeBatch(batch("cf/next.bin", 2n)))).resolves.not.toBe("timeout")
    await handle.rollbackUpdate()
  })

  it("очищает pending и счётчик после синхронной ошибки postMessage", async () => {
    const projectDir = await createProjectDir()
    const handle = createHandle({ compatibility, maxInFlightBatches: 1 })
    await handle.beginUpdate(projectDir)
    const untransferable = batch("cf/untransferable.bin", 1n)
    markAsUntransferable(untransferable.hashBytes.buffer)

    await expect(handle.writeBatch(untransferable)).rejects.toThrow()
    await expect(settleWithin(handle.writeBatch(batch("cf/next.bin", 2n)))).resolves.not.toBe("timeout")
    await handle.rollbackUpdate()
  })

  it("повторно проверяет batch на недоверенной границе worker", async () => {
    const projectDir = await createProjectDir()
    const worker = new Worker(new URL("./writerWorker.ts", import.meta.url), { execArgv: sourceWorkerExecArgv() })
    const operationId = "raw-operation"
    try {
      await expect(sendRaw(worker, {
        kind: "openProject",
        requestId: "open",
        projectDir,
        compatibility,
      })).resolves.toMatchObject({ kind: "ack" })
      await expect(sendRaw(worker, {
        kind: "beginUpdate",
        requestId: "begin",
        operationId,
      })).resolves.toMatchObject({ kind: "ack" })

      const response = await sendRaw(worker, {
        kind: "writeBatch",
        requestId: "invalid",
        operationId,
        batch: {
          updates: [resource("cf/a.bin")],
          hashBytes: new Uint8Array(new ArrayBuffer(9), 0, 8),
        },
      } as unknown as ProjectStateWriterCommand)

      expect(response).toMatchObject({ kind: "failed", requestId: "invalid" })
      if (response.kind !== "failed") throw new Error("Worker принял некорректный batch")
      expect(response.error.message).toContain("hashBytes")

      const sharedResponse = await sendRaw(worker, {
        kind: "writeBatch",
        requestId: "shared",
        operationId,
        batch: {
          updates: [resource("cf/shared.bin")],
          hashBytes: new Uint8Array(new SharedArrayBuffer(8)),
        },
      })
      expect(sharedResponse).toMatchObject({ kind: "failed", requestId: "shared" })
      if (sharedResponse.kind !== "failed") throw new Error("Worker принял SharedArrayBuffer")
      expect(sharedResponse.error.message).toContain("ArrayBuffer")

      await sendRaw(worker, { kind: "rollbackUpdate", requestId: "rollback", operationId })
      await sendRaw(worker, { kind: "close", requestId: "close" })
    } finally {
      await worker.terminate()
    }
  })

  it("обходит заполненную очередь для отмены и подтверждает её только после rollback", async () => {
    const projectDir = await createProjectDir()
    await writeSnapshot(projectDir, "cf/old.bin")
    const controller = new AbortController()
    const handle = createHandle({ compatibility, maxInFlightBatches: 1, signal: controller.signal, workerData: { writeDelayMs: 200 } })
    await handle.beginUpdate(projectDir)
    const batches = [batch("cf/a.bin", 1n), batch("cf/b.bin", 2n), batch("cf/c.bin", 3n)]
    const writes = batches.map((value) => handle.writeBatch(value))
    expect(batches[0]!.hashBytes.byteLength).toBe(0)
    expect(batches.slice(1).map((value) => value.hashBytes.byteLength)).toEqual([8, 8])

    controller.abort()

    const settled = await Promise.allSettled(writes)
    expect(settled.every((result) => result.status === "rejected" && result.reason instanceof ProjectStateWriterCancelledError)).toBe(true)
    await expect(handle.commitAndCheckpoint()).rejects.toBeInstanceOf(ProjectStateWriterCancelledError)

    const reopened = await openPersistentSqliteProjectStateStore({ projectDir, compatibility })
    expect(reopened.store.readComponentProjection("cf").updates).toEqual([resource("cf/old.bin")])
    reopened.store.close()
  })

  it("принимает отмену до необратимой commit-фазы и не публикует обновление", async () => {
    const projectDir = await createProjectDir()
    await writeSnapshot(projectDir, "cf/old.bin")
    const controller = new AbortController()
    const handle = createHandle({
      compatibility,
      signal: controller.signal,
      workerData: { serializeCheckpoints: true },
    } as unknown as Parameters<typeof createProjectStateWriterHandle>[0])
    await handle.beginUpdate(projectDir)
    await handle.writeBatch(batch("cf/cancelled.bin", 2n))

    const committing = handle.commitAndCheckpoint()
    controller.abort()

    await expect(committing).rejects.toBeInstanceOf(ProjectStateWriterCancelledError)
    await handle.close()
    const reopened = await openPersistentSqliteProjectStateStore({ projectDir, compatibility })
    expect(reopened.store.readComponentProjection("cf").updates).toEqual([resource("cf/old.bin")])
    reopened.store.close()
  })

  it("не отправляет ложную отмену после входа в необратимую commit-фазу", async () => {
    const projectDir = await createProjectDir()
    const controller = new AbortController()
    const handle = createHandle({
      compatibility,
      signal: controller.signal,
      workerData: {
        commitDelayMs: 100,
        failCheckpointAfterLateCancel: true,
        serializeCheckpoints: true,
      },
    } as unknown as Parameters<typeof createProjectStateWriterHandle>[0])
    await handle.beginUpdate(projectDir)
    await handle.writeBatch(batch("cf/committed.bin", 2n))

    const committing = handle.commitAndCheckpoint()
    await new Promise((resolve) => setTimeout(resolve, 20))
    controller.abort()

    await expect(committing).resolves.toEqual({ snapshotPath: projectStateSnapshotPath(projectDir) })
    await handle.close()
    const reopened = await openPersistentSqliteProjectStateStore({ projectDir, compatibility })
    expect(reopened.store.readComponentProjection("cf").updates).toEqual([resource("cf/committed.bin")])
    reopened.store.close()
  })

  it("одним закрытием завершает конкурентные close и все незавершённые batch", async () => {
    const projectDir = await createProjectDir()
    const handle = createHandle({
      compatibility,
      maxInFlightBatches: 1,
      workerData: { writeDelayMs: 200 },
    })
    await handle.beginUpdate(projectDir)
    const writes = [handle.writeBatch(batch("cf/a.bin", 1n)), handle.writeBatch(batch("cf/b.bin", 2n))]

    const closing = Promise.allSettled([handle.close(), handle.close(), ...writes])
    const settled = await settleWithin(closing)

    expect(settled).not.toBe("timeout")
    if (settled === "timeout") return
    expect(settled.slice(0, 2).every((result) => result.status === "fulfilled")).toBe(true)
    const rejected = settled.slice(2)
    expect(rejected.every((result) => result.status === "rejected" && result.reason.name === "ProjectStateWriterClosedError")).toBe(true)
    if (rejected[0]?.status !== "rejected" || rejected[1]?.status !== "rejected") return
    expect(rejected[1].reason).toBe(rejected[0].reason)
  })

  it("завершает pending batch при неожиданном выходе worker с кодом 0", async () => {
    const projectDir = await createProjectDir()
    const handle = createHandle({
      compatibility,
      workerData: { exitDuringWrite: true },
    } as unknown as Parameters<typeof createProjectStateWriterHandle>[0])
    await handle.beginUpdate(projectDir)

    const settled = await settleWithin(Promise.allSettled([handle.writeBatch(batch("cf/a.bin", 1n))]))

    expect(settled).not.toBe("timeout")
    if (settled === "timeout") return
    expect(settled[0]).toMatchObject({
      status: "rejected",
      reason: { message: expect.stringContaining("worker") },
    })
    await expect(settleWithin(handle.close())).resolves.not.toBe("timeout")
  })

  it("после аварии между commit и checkpoint повторно открывает предыдущий снимок", async () => {
    const projectDir = await createProjectDir()
    await writeSnapshot(projectDir, "cf/old.bin")
    const handle = createHandle({ compatibility, workerData: { crashAfterCommit: true } })
    await handle.beginUpdate(projectDir)
    await handle.writeBatch(batch("cf/new.bin", 2n))

    await expect(handle.commitAndCheckpoint()).rejects.toThrow("worker")

    const reopened = await openPersistentSqliteProjectStateStore({ projectDir, compatibility })
    expect(reopened.store.readComponentProjection("cf").updates).toEqual([resource("cf/old.bin")])
    reopened.store.close()
  })

  it("после ошибки checkpoint восстанавливает старый снимок и принимает следующее обновление", async () => {
    const projectDir = await createProjectDir()
    await writeSnapshot(projectDir, "cf/old.bin")
    const handle = createHandle({
      compatibility,
      workerData: { failNextCheckpoint: true, serializeCheckpoints: true },
    } as unknown as Parameters<typeof createProjectStateWriterHandle>[0])
    await handle.beginUpdate(projectDir)
    await handle.writeBatch(batch("cf/unpublished.bin", 2n))

    await expect(handle.commitAndCheckpoint()).rejects.toThrow("checkpoint failed")
    await handle.beginUpdate(projectDir)
    await handle.writeBatch(batch("cf/next.bin", 3n))
    await handle.commitAndCheckpoint()
    await handle.close()

    const reopened = await openPersistentSqliteProjectStateStore({ projectDir, compatibility })
    expect(reopened.store.readComponentProjection("cf").updates).toEqual([
      resource("cf/old.bin"),
      resource("cf/next.bin"),
    ])
    reopened.store.close()
  })

  async function writeSnapshot(projectDir: string, projectPath: string): Promise<void> {
    const fixture = await openPersistentSqliteProjectStateStore({
      projectDir,
      compatibility,
      hooks: {
        backup: async (database, target) => fs.promises.writeFile(target, database.serialize()),
      },
    })
    fixture.store.beginUpdate()
    fixture.store.replaceFiles({ updates: [resource(projectPath)], hashBytes: new Uint8Array(8) })
    fixture.store.commitUpdate()
    await fixture.store.checkpoint()
    fixture.store.close()
  }
})

function resource(projectPath: string): ProjectStateFileUpdate {
  return { kind: "resource", projectPath, componentPath: "cf", resourceKind: "resource" }
}

function identity({ kind: _kind, ...value }: ProjectStateFileUpdate) {
  return value
}

function batch(projectPath: string, hash: bigint) {
  return createProjectStateFileUpdateBatch([{ update: resource(projectPath), hash }])
}

function sendRaw(worker: Worker, command: ProjectStateWriterCommand): Promise<ProjectStateWriterResponse> {
  return new Promise((resolve, reject) => {
    const onMessage = (response: ProjectStateWriterResponse) => {
      if (response.requestId !== command.requestId) return
      cleanup()
      resolve(response)
    }
    const onError = (caught: Error) => {
      cleanup()
      reject(caught)
    }
    const cleanup = () => {
      worker.off("message", onMessage)
      worker.off("error", onError)
    }
    worker.on("message", onMessage)
    worker.on("error", onError)
    worker.postMessage(command)
  })
}

function settleWithin<T>(promise: Promise<T>, milliseconds = 1_000): Promise<T | "timeout"> {
  return Promise.race([
    promise,
    new Promise<"timeout">((resolve) => setTimeout(() => resolve("timeout"), milliseconds)),
  ])
}
