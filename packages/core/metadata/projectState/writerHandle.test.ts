import fs from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { Worker } from "node:worker_threads"
import { afterEach, describe, expect, it } from "vitest"
import type { ProjectStateCompatibility } from "./compatibility"
import { createProjectStateFileUpdateBatch, type ProjectStateFileUpdate } from "./fileUpdate"
import { sourceWorkerExecArgv } from "../sourceWorkerRuntime"
import { openPersistentSqliteProjectStateStore, projectStateSnapshotPath } from "./sqlite/persistence"
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
  const projectDirs: string[] = []
  const handles: ProjectStateWriterHandle[] = []

  afterEach(async () => {
    await Promise.all(handles.splice(0).map((handle) => handle.close().catch(() => undefined)))
    await Promise.all(projectDirs.splice(0).map((directory) => fs.promises.rm(directory, { recursive: true })))
  })

  async function createProjectDir(): Promise<string> {
    const directory = await fs.promises.mkdtemp(join(tmpdir(), "nkdk-project-state-writer-"))
    projectDirs.push(directory)
    return directory
  }

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

  async function writeSnapshot(projectDir: string, projectPath: string): Promise<void> {
    const fixture = await openPersistentSqliteProjectStateStore({ projectDir, compatibility })
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
