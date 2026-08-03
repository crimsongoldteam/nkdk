import { markAsUntransferable } from "node:worker_threads"
import { afterEach, describe, expect, it, vi } from "vitest"
import type { ProjectStateCompatibility } from "./compatibility"
import { createProjectStateFileUpdateBatch, type ProjectStateFileUpdate } from "./fileUpdate"
import type { ProjectStateReadToken } from "./contracts"
import {
  acknowledgeWriterCommand,
  createMockWriterTransport,
  type MockWriterTransport,
  type MockWriterTransportOutcome,
} from "./tests/mockWriterTransport"
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
  const handles: ProjectStateWriterHandle[] = []

  afterEach(async () => {
    await Promise.all(handles.splice(0).map((handle) => handle.close().catch(() => undefined)))
  })

  function createHandle(transport: MockWriterTransport, maxInFlightBatches?: number): ProjectStateWriterHandle {
    const handle = createProjectStateWriterHandle({
      compatibility,
      maxInFlightBatches,
      transportFactory: () => transport,
    })
    handles.push(handle)
    return handle
  }

  it("ограничивает число отправленных batch и продолжает очередь после каждого ответа", async () => {
    const pending: ((response: ProjectStateWriterResponse) => void)[] = []
    const transport = createMockWriterTransport((command) => command.kind === "writeBatch"
      ? new Promise((resolve) => pending.push(resolve))
      : acknowledgeWriterCommand(command))
    const handle = createHandle(transport, 1)
    await handle.beginUpdate("/project")
    const batches = [batch("cf/a.bin", 1n), batch("cf/b.bin", 2n), batch("cf/c.bin", 3n)]

    const writes = batches.map((value) => handle.writeBatch(value))
    expect(commandKinds(transport)).toEqual(["openProject", "beginUpdate", "writeBatch"])
    expect(batches.map(({ hashBytes }) => hashBytes.byteLength)).toEqual([0, 8, 8])

    respondToWrite(transport, pending.shift()!, 0)
    await Promise.resolve()
    await Promise.resolve()
    expect(commandKinds(transport)).toEqual(["openProject", "beginUpdate", "writeBatch", "writeBatch"])
    expect(batches.map(({ hashBytes }) => hashBytes.byteLength)).toEqual([0, 0, 8])

    respondToWrite(transport, pending.shift()!, 1)
    await Promise.resolve()
    await Promise.resolve()
    respondToWrite(transport, pending.shift()!, 2)
    await Promise.all(writes)
    await expect(handle.commitAndCheckpoint()).resolves.toEqual({ snapshotPath: "/mock/project-state.sqlite" })
    expect(commandKinds(transport)).toEqual([
      "openProject", "beginUpdate", "writeBatch", "writeBatch", "writeBatch", "commitUpdate", "checkpoint",
    ])
  })

  it("возвращает данные нейтральных read-команд без знания транспорта", async () => {
    const update = resource("cf/a.bin")
    const transport = createMockWriterTransport((command) => {
      switch (command.kind) {
        case "compareFiles": return response(command, { kind: "filesCompared", changes: { changed: [{ index: 0, file: identity(update) }], deleted: [] } })
        case "readLocalDiagnostics": return response(command, { kind: "localDiagnostics", diagnostics: [] })
        case "createReadToken": return response(command, { kind: "readToken", token: new Uint8Array([1]) as ProjectStateReadToken })
        case "readComponentProjection": {
          return response(command, { kind: "componentProjection", projection: { componentPath: "cf", updates: [update], hashBytes: new Uint8Array(8) } })
        }
        default: return acknowledgeWriterCommand(command)
      }
    })
    const handle = createHandle(transport)
    await handle.openProject("/project")

    await expect(handle.compareFiles({ files: [identity(update)], hashBytes: new Uint8Array(8) })).resolves.toEqual({
      changed: [{ index: 0, file: identity(update) }],
      deleted: [],
    })
    await expect(handle.readLocalDiagnostics()).resolves.toEqual([])
    await expect(handle.createReadToken()).resolves.toEqual(new Uint8Array([1]))
    await expect(handle.readComponentProjection("cf")).resolves.toEqual({
      componentPath: "cf",
      updates: [update],
      hashBytes: new Uint8Array(8),
    })
    expect(commandKinds(transport)).toEqual([
      "openProject", "compareFiles", "readLocalDiagnostics", "createReadToken", "readComponentProjection",
    ])
  })

  it("пакетно читает исходные хэши до начала обновления", async () => {
    const file = identity(resource("cf/a.bin"))
    const baseline = {
      knownHashBits: Uint8Array.of(1),
      hashBytes: Uint8Array.from([1, 2, 3, 4, 5, 6, 7, 8]),
      deleted: [],
    }
    const transport = createMockWriterTransport((command) => command.kind === "readFileBaseline"
      ? response(command, { kind: "fileBaseline", baseline })
      : acknowledgeWriterCommand(command))
    const handle = createHandle(transport)
    await handle.openProject("/project")

    await expect(handle.readFileBaseline([file])).resolves.toEqual(baseline)
    expect(commandKinds(transport)).toEqual(["openProject", "readFileBaseline"])
  })

  it("отклоняет исходные хэши неверной позиционной длины", async () => {
    const file = identity(resource("cf/a.bin"))
    const transport = createMockWriterTransport((command) => command.kind === "readFileBaseline"
      ? response(command, {
          kind: "fileBaseline",
          baseline: { knownHashBits: Uint8Array.of(1), hashBytes: new Uint8Array(7), deleted: [] },
        })
      : acknowledgeWriterCommand(command))
    const handle = createHandle(transport)
    await handle.openProject("/project")

    await expect(handle.readFileBaseline([file])).rejects.toThrow("hashBytes")
  })

  it("дожидается batch перед dependency validation и передаёт operationId", async () => {
    let resolveWrite!: (response: ProjectStateWriterResponse) => void
    const transport = createMockWriterTransport((command) => {
      if (command.kind === "writeBatch") return new Promise((resolve) => {
        resolveWrite = resolve
      })
      return acknowledgeWriterCommand(command)
    })
    const handle = createHandle(transport)
    await handle.beginUpdate("/project")
    const writing = handle.writeBatch(batch("cf/a.bin", 1n))
    const validating = handle.validateDependencies()

    expect(commandKinds(transport)).not.toContain("validateDependencies")
    respondToWrite(transport, resolveWrite, 0)
    await writing
    await expect(validating).resolves.toEqual([])
    const begin = commandOfKind(transport, "beginUpdate")
    const validate = commandOfKind(transport, "validateDependencies")
    expect(validate.operationId).toBe(begin.operationId)
  })

  it.each([
    ["смещение", new Uint8Array(new ArrayBuffer(9), 1, 8), 9],
    ["длина представления", new Uint8Array(7), 7],
    ["длина backing buffer", new Uint8Array(new ArrayBuffer(9), 0, 8), 9],
  ])("отклоняет неверный общий буфер до postMessage: %s", async (_name, hashBytes, bufferLength) => {
    const transport = createMockWriterTransport()
    const handle = createHandle(transport)
    await handle.beginUpdate("/project")

    await expect(handle.writeBatch({ updates: [resource("cf/a.bin")], hashBytes })).rejects.toThrow("hashBytes")
    expect(hashBytes.buffer.byteLength).toBe(bufferLength)
    expect(commandKinds(transport)).toEqual(["openProject", "beginUpdate"])
  })

  it.each([
    ["SharedArrayBuffer", () => ({ updates: [resource("cf/shared.bin")], hashBytes: new Uint8Array(new SharedArrayBuffer(8)) })],
    ["непереносимый ArrayBuffer", () => {
      const value = batch("cf/untransferable.bin", 1n)
      markAsUntransferable(value.hashBytes.buffer)
      return value
    }],
  ])("не блокирует очередь после ошибки передачи: %s", async (_name, invalid) => {
    const transport = createMockWriterTransport()
    const handle = createHandle(transport, 1)
    await handle.beginUpdate("/project")

    await expect(handle.writeBatch(invalid())).rejects.toThrow()
    await expect(handle.writeBatch(batch("cf/next.bin", 2n))).resolves.toBeUndefined()
    expect(commandKinds(transport)).toEqual(["openProject", "beginUpdate", "writeBatch"])
  })

  it("обходит заполненную очередь для отмены и подтверждает её после cancelOperation", async () => {
    const transport = createMockWriterTransport((command) => command.kind === "writeBatch"
      ? new Promise<MockWriterTransportOutcome>(() => undefined)
      : acknowledgeWriterCommand(command))
    const controller = new AbortController()
    const handle = createHandle(transport, 1)
    await handle.beginUpdate("/project", controller.signal)
    const batches = [batch("cf/a.bin", 1n), batch("cf/b.bin", 2n), batch("cf/c.bin", 3n)]
    const writes = batches.map((value) => handle.writeBatch(value))

    controller.abort()

    const settled = await Promise.allSettled(writes)
    expect(settled.every((result) => result.status === "rejected" && result.reason instanceof ProjectStateWriterCancelledError)).toBe(true)
    await expect(handle.commitAndCheckpoint()).rejects.toBeInstanceOf(ProjectStateWriterCancelledError)
    expect(commandKinds(transport)).toEqual(["openProject", "beginUpdate", "writeBatch", "cancelOperation"])
  })

  it("удаляет listener старого signal после подтверждённой отмены", async () => {
    const oldController = new AbortController()
    const transport = createMockWriterTransport((command) => command.kind === "writeBatch" && command.batch.updates[0]?.projectPath === "cf/old.bin"
      ? new Promise<MockWriterTransportOutcome>(() => undefined)
      : acknowledgeWriterCommand(command))
    const handle = createHandle(transport)
    await handle.beginUpdate("/project", oldController.signal)
    const oldWrite = handle.writeBatch(batch("cf/old.bin", 1n))
    oldController.abort()
    await expect(oldWrite).rejects.toBeInstanceOf(ProjectStateWriterCancelledError)
    await handle.rollbackUpdate()

    await handle.beginUpdate("/project", new AbortController().signal)
    oldController.signal.dispatchEvent(new Event("abort"))
    await handle.writeBatch(batch("cf/next.bin", 2n))
    await handle.rollbackUpdate()

    expect(commandKinds(transport).filter((kind) => kind === "cancelOperation")).toHaveLength(1)
  })

  it("игнорирует late cancel после входа в необратимую commit-фазу", async () => {
    let resolveCommit!: (response: ProjectStateWriterResponse) => void
    const transport = createMockWriterTransport((command) => command.kind === "commitUpdate"
      ? new Promise((resolve) => {
          resolveCommit = resolve
        })
      : acknowledgeWriterCommand(command))
    const controller = new AbortController()
    const handle = createHandle(transport)
    await handle.beginUpdate("/project", controller.signal)
    await handle.writeBatch(batch("cf/a.bin", 1n))

    const committing = handle.commitAndCheckpoint()
    await Promise.resolve()
    await Promise.resolve()
    const commit = commandOfKind(transport, "commitUpdate")
    controller.abort()
    resolveCommit(response(commit, { kind: "updateCommitted", operationId: commit.operationId }))

    await expect(committing).resolves.toEqual({ snapshotPath: "/mock/project-state.sqlite" })
    expect(commandKinds(transport)).not.toContain("cancelOperation")
  })

  it("одним закрытием завершает конкурентные close и все незавершённые batch", async () => {
    const transport = createMockWriterTransport((command) => command.kind === "writeBatch"
      ? new Promise<MockWriterTransportOutcome>(() => undefined)
      : acknowledgeWriterCommand(command))
    const handle = createHandle(transport, 1)
    await handle.beginUpdate("/project")
    const writes = [handle.writeBatch(batch("cf/a.bin", 1n)), handle.writeBatch(batch("cf/b.bin", 2n))]

    const settled = await Promise.allSettled([handle.close(), handle.close(), ...writes])

    expect(settled.slice(0, 2).every((result) => result.status === "fulfilled")).toBe(true)
    const rejected = settled.slice(2)
    expect(rejected.every((result) => result.status === "rejected" && result.reason.name === "ProjectStateWriterClosedError")).toBe(true)
    if (rejected[0]?.status !== "rejected" || rejected[1]?.status !== "rejected") return
    expect(rejected[1].reason).toBe(rejected[0].reason)
    expect(commandKinds(transport).filter((kind) => kind === "close")).toHaveLength(1)
  })

  it("завершает pending batch при неожиданном exit с кодом 0", async () => {
    const transport = createMockWriterTransport((command) => command.kind === "writeBatch"
      ? { kind: "transportExit", code: 0 }
      : acknowledgeWriterCommand(command))
    const handle = createHandle(transport)
    await handle.beginUpdate("/project")

    await expect(handle.writeBatch(batch("cf/a.bin", 1n))).rejects.toThrow("worker неожиданно завершился с кодом 0")
    await expect(handle.close()).resolves.toBeUndefined()
  })

  it("после ошибки checkpoint повторно открывает проект и принимает следующее обновление", async () => {
    let checkpoint = 0
    const transport = createMockWriterTransport((command) => {
      if (command.kind === "checkpoint" && checkpoint++ === 0) {
        return { kind: "failed", requestId: command.requestId, error: { name: "Error", message: "checkpoint failed" } }
      }
      return acknowledgeWriterCommand(command)
    })
    const handle = createHandle(transport)
    await handle.beginUpdate("/project")
    await handle.writeBatch(batch("cf/first.bin", 1n))

    await expect(handle.commitAndCheckpoint()).rejects.toThrow("checkpoint failed")
    await handle.beginUpdate("/project")
    await handle.writeBatch(batch("cf/next.bin", 2n))
    await expect(handle.commitAndCheckpoint()).resolves.toEqual({ snapshotPath: "/mock/project-state.sqlite" })
    expect(commandKinds(transport).filter((kind) => kind === "openProject")).toHaveLength(2)
  })

  it("считает rollback без активного обновления завершённым", async () => {
    const transport = createMockWriterTransport()
    const handle = createHandle(transport)
    await handle.openProject("/project")

    await expect(handle.rollbackUpdate()).resolves.toBeUndefined()
    expect(commandKinds(transport)).toEqual(["openProject"])
  })

  it("использует переданную transport factory", () => {
    const transport = createMockWriterTransport()
    const transportFactory = vi.fn(() => transport)

    const handle = createProjectStateWriterHandle({ compatibility, transportFactory })
    handles.push(handle)

    expect(transportFactory).toHaveBeenCalledOnce()
  })
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

function commandKinds(transport: MockWriterTransport): ProjectStateWriterCommand["kind"][] {
  return transport.commands.map(({ kind }) => kind)
}

function commandOfKind<K extends ProjectStateWriterCommand["kind"]>(
  transport: MockWriterTransport,
  kind: K,
): Extract<ProjectStateWriterCommand, { kind: K }> {
  const command = transport.commands.find((candidate): candidate is Extract<ProjectStateWriterCommand, { kind: K }> => candidate.kind === kind)
  if (command === undefined) throw new Error(`Команда ${kind} не отправлена`)
  return command
}

function respondToWrite(
  transport: MockWriterTransport,
  resolve: (response: ProjectStateWriterResponse) => void,
  index: number,
): void {
  const command = transport.commands.filter((candidate): candidate is Extract<ProjectStateWriterCommand, { kind: "writeBatch" }> => candidate.kind === "writeBatch")[index]!
  resolve(response(command, { kind: "batchWritten", operationId: command.operationId }))
}

function response(
  command: ProjectStateWriterCommand,
  result: Extract<ProjectStateWriterResponse, { kind: "ack" }>["result"],
): ProjectStateWriterResponse {
  return { kind: "ack", requestId: command.requestId, result }
}
