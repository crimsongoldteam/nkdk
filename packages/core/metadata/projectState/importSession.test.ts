import fs from "node:fs"
import os from "node:os"
import { join } from "node:path"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { createProjectStateFileUpdateBatch } from "./fileUpdate"
import { createProjectStateFragmentWriter } from "./binary/fragment"
import { createBinaryProjectStateTestFixture } from "./binary/testFixture"
import { assertProjectStateFileUpdateBatch } from "./fileUpdateValidation"
import { createDefaultProjectStateService as createProjectStateService } from "../composition/projectState"
import type {
  ProjectStateImportFinalFileStateBatch,
  ProjectStateImportIndexContribution,
  ProjectStateImportSession,
} from "./importSession"
import { assertProjectStateImportFinalFileStateBatch, createProjectStateImportSession } from "./importSession"
import type { ProjectStateWriterHandle } from "./writerHandle"
import { createProjectStateWriterHandle } from "./writerHandle"

describe("ProjectState import session", () => {
  it("принимает файловые цели в окончательном resource-state", () => {
    const update = {
      kind: "resource" as const,
      projectPath: "cf/Документ/Заказ/Макеты/Печать/Template.xml",
      componentPath: "cf",
      resourceKind: "resource" as const,
      targets: [{
        kind: "member" as const,
        canonical: "Document.Заказ.Template.Печать",
        fileBacked: {
          itemProjectPath: "cf/Документ/Заказ/Макеты/Печать",
          ownerProjectPath: "cf/Документ/Заказ/Свойства.yaml",
        },
      }],
    }

    expect(() => assertProjectStateImportFinalFileStateBatch({
      updates: [update],
      hashBytes: new Uint8Array(8),
    })).not.toThrow()
  })

  const contribution = indexContribution("cf/Справочник/Товары/Свойства.yaml", "Товары")
  let projectDir: string
  let state: ReturnType<typeof createProjectStateService>
  let session: ProjectStateImportSession
  let firstToken: Awaited<ReturnType<ProjectStateImportSession["commitWorkingIndex"]>>
  let secondToken: Awaited<ReturnType<ProjectStateImportSession["createReadToken"]>>

  beforeAll(async () => {
    projectDir = fs.mkdtempSync(join(os.tmpdir(), "nkdk-import-state-"))
    state = createProjectStateService()
    session = await state.beginImport({ projectDir, workerCount: 2, output: { componentPaths: ["cf"] } })
    await session.writeStateFragment(stateFragment([contribution]))
    firstToken = await session.commitWorkingIndex()
    secondToken = await session.createReadToken()
  })

  afterAll(async () => {
    await state.close()
    await fs.promises.rm(projectDir, { recursive: true, force: true })
  })

  it("фиксирует индекс для отдельных read sessions и принимает после этого окончательный фрагмент", async () => {
    const first = state.openReadSession(firstToken)
    const second = state.openReadSession(secondToken)
    expect(first.readOwners([{ requestId: "one", componentPath: "cf", owner: { kind: "Справочник", name: "Товары" } }]))
      .toEqual([expect.objectContaining({ requestId: "one", status: "found" })])
    expect(second.readOwners([{ requestId: "two", componentPath: "cf", owner: { kind: "Справочник", name: "Товары" } }]))
      .toEqual([expect.objectContaining({ requestId: "two", status: "found" })])

    const before = first.readComponentTargetPage({ componentPath: "cf" })
    await session.writeStateFragment(stateFragment(
      [contribution],
      [finalBatch(contribution.projectPath, 0x0102030405060708n)],
    ))
    expect(first.readComponentTargetPage({ componentPath: "cf" })).toEqual(before)
    first.close()
    second.close()

    const result = await session.finalize()
    expect([...result.diagnostics]).toEqual([])
    expect(result.stats).toMatchObject({ changedFiles: 1 })
  })

  it("не сохраняет рабочий индекс и сохраняет всё окончательное состояние один раз", async () => {
    const saved: unknown[] = []
    const writer = createProjectStateWriterHandle({
      openStore: async () => createBinaryProjectStateTestFixture().store,
      async save(_projectDir, buffers) { saved.push(buffers) },
    })
    const indexed = indexContribution("cf/a.yaml", "Товары")
    const importSession = await createProjectStateImportSession({
      projectDir: "/project",
      workerCount: 1,
      output: { componentPaths: ["cf"] },
      writer,
      async publish() {},
      async discard() {},
    })

    await importSession.writeStateFragment(stateFragment([indexed]))
    const firstToken = await importSession.commitWorkingIndex()
    const secondToken = await importSession.createReadToken()
    expect(firstToken.buffers.files).toBe(secondToken.buffers.files)
    await writer.flushCheckpoint()
    expect(saved).toHaveLength(0)

    await importSession.writeStateFragment(stateFragment([indexed], [finalBatch(indexed.projectPath, 4n)]))
    await importSession.finalize()
    await writer.flushCheckpoint()
    expect(saved).toHaveLength(1)
    await writer.close()
  })

  it.each([
    ["ненулевое смещение", new Uint8Array(new ArrayBuffer(9), 1, 8)],
    ["короче", new Uint8Array(7)],
    ["длиннее", new Uint8Array(9)],
    ["увеличенный backing buffer", new Uint8Array(new ArrayBuffer(9), 0, 8)],
  ])("отклоняет final hashBytes: %s", (_name, hashBytes) => {
    const contribution = indexContribution("cf/Справочник/Товары/Свойства.yaml", "Товары")
    expect(() => assertProjectStateImportFinalFileStateBatch({
      updates: [finalState(contribution.projectPath)],
      hashBytes,
    })).toThrow(/hashBytes/iu)
  })

  it.each([
    ["extra bigint на updates", arrayWithProperty([finalState(contribution.projectPath)], "extra", 1n), new Uint8Array(8)],
    ["symbol на updates", arrayWithProperty([finalState(contribution.projectPath)], Symbol("extra"), true), new Uint8Array(8)],
    ["symbol на hashBytes", [finalState(contribution.projectPath)], arrayWithProperty(new Uint8Array(8), Symbol("extra"), true)],
  ])("отклоняет нестандартное поле final batch: %s", (_name, updates, hashBytes) => {
    expect(() => assertProjectStateImportFinalFileStateBatch({ updates, hashBytes })).toThrow()
  })

  it("кодирует несколько xxHash64 в одном zero-offset big-endian буфере и переносит только его", () => {
    const batch = createProjectStateFileUpdateBatch([
      { update: resource("cf/one.bin"), hash: 0x0102030405060708n },
      { update: resource("cf/two.bin"), hash: 0xf1f2f3f4f5f6f7f8n },
    ])
    const transfer = [batch.hashBytes.buffer as ArrayBuffer]
    const cloned = structuredClone(batch, { transfer })

    expect([...cloned.hashBytes]).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8,
      0xf1, 0xf2, 0xf3, 0xf4, 0xf5, 0xf6, 0xf7, 0xf8,
    ])
    expect(cloned.hashBytes.byteOffset).toBe(0)
    expect(cloned.hashBytes.buffer.byteLength).toBe(16)
    expect(cloned.updates.every((update) => !("hash" in update) && !("hashOffset" in update))).toBe(true)
  })

  it.each([
    ["лишнее верхнее поле", { ...finalState(contribution.projectPath), unexpected: true }],
    ["несогласованный resource discriminant", {
      ...resource("cf/module.bsl"), resourceKind: "yaml", yamlRole: "properties",
    }],
    ["yaml без yamlRole", (() => {
      const { yamlRole: _yamlRole, ...value } = finalState(contribution.projectPath)
      return value
    })()],
    ["bigint внутри diagnostics", {
      ...finalState(contribution.projectPath),
      localValidation: { contributedFacts: true, diagnostics: [{ rule: 1n }], schemaDiagnostics: [] },
    }],
    ["function внутри pendingChecks", {
      ...finalState(contribution.projectPath), pendingChecks: [{ policy: () => true }],
    }],
    ["rule object внутри local validation", {
      ...finalState(contribution.projectPath),
      localValidation: { contributedFacts: true, diagnostics: [], schemaDiagnostics: [], rule: {} },
    }],
    ["extra bigint на массиве pendingChecks", {
      ...finalState(contribution.projectPath), pendingChecks: arrayWithProperty([], "extra", 1n),
    }],
    ["extra function на массиве pendingChecks", {
      ...finalState(contribution.projectPath), pendingChecks: arrayWithProperty([], "extra", () => undefined),
    }],
    ["symbol на массиве pendingChecks", {
      ...finalState(contribution.projectPath), pendingChecks: arrayWithProperty([], Symbol("extra"), true),
    }],
    ["extra поле на вложенном yamlPath", {
      ...finalState(contribution.projectPath),
      pendingChecks: [pendingCheck(arrayWithProperty(["Объект"], "extra", 1n))],
    }],
    ["accessor на вложенном yamlPath", {
      ...finalState(contribution.projectPath),
      pendingChecks: [pendingCheck(arrayWithAccessor(["Объект"], "extra"))],
    }],
  ])("отклоняет непереносимый или неточный final DTO: %s", (_name, update) => {
    expect(() => assertProjectStateImportFinalFileStateBatch({
      updates: [update],
      hashBytes: new Uint8Array(8),
    })).toThrow()
  })

  it.each([
    ["null prototype", null],
    ["custom prototype", { inherited: true }],
  ])("отклоняет prototype верхнего final batch: %s", (_name, prototype) => {
    const batch = recordWithPrototype({
      updates: [finalState(contribution.projectPath)],
      hashBytes: new Uint8Array(8),
    }, prototype)

    expect(() => assertProjectStateImportFinalFileStateBatch(batch)).toThrow(/обычным объектом/iu)
  })

  it.each([
    ["update", (update: ReturnType<typeof finalState>) => recordWithPrototype(update, null)],
    ["nested payload", (update: ReturnType<typeof finalState>) => ({
      ...update,
      localValidation: recordWithPrototype(update.localValidation, null),
    })],
    ["nested yamlPath", (update: ReturnType<typeof finalState>) => ({
      ...update,
      pendingChecks: [pendingCheck(arrayWithPrototype(["Объект"], null))],
    })],
  ])("отклоняет нестандартный prototype final DTO: %s", (_name, mutate) => {
    expect(() => assertProjectStateImportFinalFileStateBatch({
      updates: [mutate(finalState(contribution.projectPath))],
      hashBytes: new Uint8Array(8),
    })).toThrow(/обычн/iu)
  })

  it("отклоняет null prototype во вложенном reference details", () => {
    const update = {
      ...fullUpdate(contribution.projectPath),
      targets: [{
        kind: "member" as const,
        canonical: "Catalog.Товары.Attribute.Код",
        details: recordWithPrototype({ kind: "attribute" }, null),
      }],
    }
    const batch = { updates: [update], hashBytes: new Uint8Array(8) }

    expect(() => assertProjectStateFileUpdateBatch(batch)).toThrow(/обычным объектом/iu)
  })

  it("не выполняет state write после начала abort и ждёт активную запись до rollback", async () => {
    const primary = new Error("sink failed")
    const writing = gate()
    const events: string[] = []
    let rolledBack = false
    let writesAfterRollback = 0
    const writer = {
      async openProject() {},
      async beginUpdate() {},
      async clearImportOutput() {},
      async writeFragment() {
        events.push("write:start")
        writing.start()
        await writing.wait()
        if (rolledBack) writesAfterRollback += 1
        events.push("write:end")
      },
      async rollbackUpdate() {
        rolledBack = true
        events.push("rollback")
      },
    } as unknown as ProjectStateWriterHandle
    const importSession = await createProjectStateImportSession({
      projectDir: "/project",
      workerCount: 1,
      output: { componentPaths: ["cf"] },
      writer,
      async publish() {},
      async discard() { events.push("discard") },
    })

    const activeWrite = importSession.writeStateFragment(stateFragment())
    await writing.started
    const aborting = importSession.abort(primary)
    await Promise.resolve()

    await expect(importSession.writeStateFragment(stateFragment()))
      .rejects.toThrow(/завершена/iu)
    expect(events).toEqual(["write:start"])
    writing.release()
    await activeWrite
    await aborting

    expect(events).toEqual(["write:start", "write:end", "rollback", "discard"])
    expect(writesAfterRollback).toBe(0)
  })

  it("ждёт начатые порции первого прохода перед фиксацией рабочего индекса", async () => {
    const writing = gate()
    const events: string[] = []
    let beginCount = 0
    const writer = {
      async openProject() {},
      async beginUpdate() { beginCount += 1 },
      async clearImportOutput() {},
      async writeFragment() {
        events.push("write:start")
        writing.start()
        await writing.wait()
        events.push("write:end")
      },
      async commitUpdate() { events.push("commit") },
      async createReadToken() { return {} as never },
    } as unknown as ProjectStateWriterHandle
    const importSession = await createProjectStateImportSession({
      projectDir: "/project",
      workerCount: 1,
      output: { componentPaths: ["cf"] },
      writer,
      async publish() {},
      async discard() {},
    })

    const activeWrite = importSession.writeStateFragment(stateFragment())
    await writing.started
    const committing = importSession.commitWorkingIndex()
    await Promise.resolve()
    expect(events).toEqual(["write:start"])

    writing.release()
    await Promise.all([activeWrite, committing])
    expect(events).toEqual(["write:start", "write:end", "commit"])
    expect(beginCount).toBe(2)
  })

  it("сообщает отдельные времена фиксации и завершения import", async () => {
    const phases: string[] = []
    const writer = {
      async openProject() {},
      async beginUpdate() {},
      async clearImportOutput() {},
      async commitUpdate() {},
      async createReadToken() { return {} as never },
      async readLocalDiagnostics() { return [] },
      async readLocalDiagnosticBatches() { return [] },
      async validateDependencies() { return [] },
      async validateDependencyDiagnosticBatches() { return [] },
      async commitAndScheduleCheckpoint() {},
    } as unknown as ProjectStateWriterHandle
    const importSession = await createProjectStateImportSession({
      projectDir: "/project",
      workerCount: 1,
      output: { componentPaths: ["cf"] },
      writer,
      profile: { onPhase: ({ phase }) => phases.push(phase) },
      async publish() {},
      async discard() {},
    })

    await importSession.commitWorkingIndex()
    await importSession.finalize()

    expect(phases).toEqual([
      "workingIndex",
      "finalBuild",
      "dependencyValidation",
      "save",
      "publication",
    ])
  })
})

function indexContribution(projectPath: string, name: string): ProjectStateImportIndexContribution {
  return {
    projectPath,
    componentPath: "cf",
    resourceKind: "yaml",
    yamlRole: "properties",
    targets: [],
    owners: [{
      owner: { kind: "Справочник", name },
      facts: {},
    }],
    fields: [],
    forms: [],
  }
}

function stateFragment(
  contributions: readonly ProjectStateImportIndexContribution[] = [],
  finalBatches: readonly ProjectStateImportFinalFileStateBatch[] = [],
) {
  const writer = createProjectStateFragmentWriter()
  for (const contribution of contributions) writer.appendImportIndex(contribution)
  for (const batch of finalBatches) writer.appendImportFinal(batch)
  return writer.finish()
}

function finalBatch(projectPath: string, hash: bigint): ProjectStateImportFinalFileStateBatch {
  const batch = createProjectStateFileUpdateBatch([{ update: fullUpdate(projectPath), hash }])
  return { updates: [finalState(projectPath)], hashBytes: batch.hashBytes }
}

function finalState(projectPath: string) {
  return {
    projectPath,
    componentPath: "cf",
    resourceKind: "yaml" as const,
    yamlRole: "properties" as const,
    kind: "yaml" as const,
    localValidation: { contributedFacts: true, diagnostics: [], schemaDiagnostics: [] },
    pendingReferences: [],
    pendingChecks: [],
    dependencies: [],
  }
}

function fullUpdate(projectPath: string) {
  return { ...finalState(projectPath), targets: [], owners: [], fields: [], forms: [] }
}

function resource(projectPath: string) {
  return {
    projectPath,
    componentPath: "cf",
    resourceKind: "resource" as const,
    kind: "resource" as const,
    targets: [],
  }
}

function pendingCheck(yamlPath: unknown[]) {
  return {
    kind: "dataPath",
    yamlPath,
    location: { line: 1, col: 1 },
    owner: { kind: "Справочник", name: "Товары" },
    value: "Объект",
    policyInput: { yaml: "ПутьКДанным" },
    policy: "formDataPath",
  }
}

function arrayWithProperty<T extends object>(values: T, key: PropertyKey, value: unknown): T {
  Object.defineProperty(values, key, { value, enumerable: true, configurable: true })
  return values
}

function arrayWithAccessor<T>(values: T[], key: PropertyKey): T[] {
  Object.defineProperty(values, key, { get: () => 1, enumerable: true, configurable: true })
  return values
}

function recordWithPrototype<T extends object>(value: T, prototype: object | null): T {
  return Object.assign(Object.create(prototype) as T, value)
}

function arrayWithPrototype<T>(value: T[], prototype: object | null): T[] {
  Object.setPrototypeOf(value, prototype)
  return value
}

function gate() {
  let unblockWrite!: () => void
  let announceStart!: () => void
  const completion = new Promise<void>((resolve) => {
    unblockWrite = resolve
  })
  return {
    started: new Promise<void>((resolve) => {
      announceStart = resolve
    }),
    release: () => unblockWrite(),
    start: () => announceStart(),
    wait: async () => completion,
  }
}
