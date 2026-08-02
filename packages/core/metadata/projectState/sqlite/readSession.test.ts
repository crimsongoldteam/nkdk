import { afterAll, beforeAll, expect, it } from "vitest"
import { Worker } from "node:worker_threads"
import type { ProjectStateYamlFileUpdate } from "../fileUpdate"
import { ProjectStateReadSessionClosedError } from "../readSession"
import { sourceWorkerExecArgv } from "../../sourceWorkerRuntime"
import { openSqliteProjectStateReadSession } from "./readSession"
import type { SqliteProjectStateStoreFixture } from "./store"
import { createSqliteProjectStateTestFixture } from "./testFixture"

let workerHarness: Awaited<ReturnType<typeof createReadSessionWorkerHarness>>

beforeAll(async () => {
  workerHarness = await createReadSessionWorkerHarness()
})

afterAll(async () => {
  await workerHarness.close()
})

it("изолирует временные пакеты двух read session одной именованной базы", () => {
  const fixture = createSqliteProjectStateTestFixture()
  const update = yaml("cf/Товары.yaml", "Catalog.Товары")
  storeYaml(fixture, update)

  const first = fixture.openReadSession(fixture.store.createReadToken())
  const second = fixture.openReadSession(fixture.store.createReadToken())
  expect(first.resolveTargets([
    { requestId: "first-missing", componentPath: "cf", canonicalTarget: "Catalog.Другой" },
    { requestId: "first-found", componentPath: "cf", canonicalTarget: "Catalog.Товары" },
  ]).map(({ requestId, status }) => ({ requestId, status }))).toEqual([
    { requestId: "first-missing", status: "missing" },
    { requestId: "first-found", status: "found" },
  ])
  expect(second.resolveTargets([
    { requestId: "second-found", componentPath: "cf", canonicalTarget: "Catalog.Товары" },
  ]).map(({ requestId, status }) => ({ requestId, status }))).toEqual([
    { requestId: "second-found", status: "found" },
  ])
  first.close()
  second.close()
})

it("отвергает token другой именованной базы", () => {
  const first = createSqliteProjectStateTestFixture()
  const second = createSqliteProjectStateTestFixture()
  const foreignToken = first.store.createReadToken()

  expect(() => second.openReadSession(foreignToken)).toThrow()
})

it("отвергает повторное открытие token после закрытия соответствующего сеанса", () => {
  const fixture = createSqliteProjectStateTestFixture()
  const token = fixture.store.createReadToken()
  const session = fixture.openReadSession(token)
  session.close()

  expect(() => fixture.openReadSession(token)).toThrow()
})

it("проверяет и одноразово закрывает token в отдельном worker thread", async () => {
  const fixture = createSqliteProjectStateTestFixture()
  const update = yaml("cf/Товары.yaml", "Catalog.Товары")
  storeYaml(fixture, update)
  const token = fixture.store.createReadToken()

  const result = await workerHarness.run(token)

  expect(result).toEqual({
    requestId: "worker",
    status: "found",
    target: { kind: "object", canonical: "Catalog.Товары" },
    source: { projectPath: "cf/Товары.yaml", componentPath: "cf" },
  })
  expect(() => fixture.openReadSession(token)).toThrow()
})

it("атомарно заявляет tokenNonce при передаче независимой копии token в worker thread", async () => {
  const fixture = createSqliteProjectStateTestFixture()
  const token = fixture.store.createReadToken()
  const tokenCopy = new Uint8Array(new SharedArrayBuffer(token.byteLength))
  tokenCopy.set(token)

  await workerHarness.run(tokenCopy)

  expect(() => fixture.openReadSession(token)).toThrow()
})

it("координированно закрывает внешний worker-сеанс вместе с хранилищем", async () => {
  const fixture = createSqliteProjectStateTestFixture()
  const closed = workerHarness.waitForClose(fixture.store.createReadToken())
  const staleToken = fixture.store.createReadToken()

  await closed.opened
  fixture.store.close()

  expect(() => fixture.openReadSession(staleToken)).toThrow()
  await expect(closed.result).resolves.toEqual({ event: "closed", queryRejected: true })
})

it("проверяет общий lifecycle перед каждым вызовом внешнего сеанса", () => {
  const fixture = createSqliteProjectStateTestFixture()
  const session = openSqliteProjectStateReadSession(fixture.store.createReadToken())

  fixture.store.close()

  expect(() => session.resolveTargets([])).toThrow(ProjectStateReadSessionClosedError)
})

function yaml(projectPath: string, canonical: string): ProjectStateYamlFileUpdate {
  return {
    kind: "yaml",
    projectPath,
    componentPath: "cf",
    resourceKind: "yaml",
    yamlRole: "configuration",
    localValidation: { contributedFacts: true, diagnostics: [], schemaDiagnostics: [] },
    references: [{ kind: "object", canonical }],
    pendingReferences: [],
    owners: [],
    fields: [],
    forms: [],
    pendingChecks: [],
    dependencies: [],
  }
}

function storeYaml(fixture: SqliteProjectStateStoreFixture, update: ProjectStateYamlFileUpdate): void {
  fixture.store.beginUpdate()
  fixture.store.replaceFiles({ updates: [update], hashBytes: new Uint8Array(8) })
  fixture.store.commitUpdate()
}

async function createReadSessionWorkerHarness(): Promise<{
  readonly run: (token: Uint8Array) => Promise<unknown>
  readonly waitForClose: (token: Uint8Array) => {
    readonly opened: Promise<void>
    readonly result: Promise<unknown>
  }
  readonly close: () => Promise<void>
}> {
  const worker = new Worker(new URL("./readSession.testWorker.ts", import.meta.url), {
    execArgv: sourceWorkerExecArgv(),
  })
  let nextRequestId = 0
  const pending = new Map<number, {
    readonly resolveOpened?: () => void
    readonly resolveResult: (value: unknown) => void
    readonly reject: (error: Error) => void
  }>()
  const ready = new Promise<void>((resolve, reject) => {
    worker.on("message", (message: {
      readonly requestId?: number
      readonly event: "ready" | "opened" | "result"
      readonly value?: unknown
    }) => {
      if (message.event === "ready") {
        resolve()
        return
      }
      if (message.requestId === undefined) return
      const request = pending.get(message.requestId)
      if (request === undefined) return
      if (message.event === "opened") {
        request.resolveOpened?.()
        return
      }
      pending.delete(message.requestId)
      request.resolveResult(message.value)
    })
    worker.once("error", reject)
    worker.once("exit", (code) => {
      if (code !== 0) reject(new Error(`SQLite read session worker завершился с кодом ${code}`))
    })
  })
  const rejectPending = (error: Error): void => {
    for (const request of pending.values()) request.reject(error)
    pending.clear()
  }
  worker.on("error", rejectPending)
  worker.on("exit", (code) => {
    if (code !== 0) rejectPending(new Error(`SQLite read session worker завершился с кодом ${code}`))
  })
  await ready

  const request = (token: Uint8Array, waitForClose: boolean) => {
    const requestId = nextRequestId
    nextRequestId += 1
    let resolveOpened!: () => void
    const opened = new Promise<void>((resolve) => {
      resolveOpened = resolve
    })
    const result = new Promise<unknown>((resolveResult, reject) => {
      pending.set(requestId, { resolveOpened, resolveResult, reject })
      worker.postMessage({ requestId, token, waitForClose })
    })
    return { opened, result }
  }

  return {
    run: (token) => request(token, false).result,
    waitForClose: (token) => request(token, true),
    close: async () => {
      await worker.terminate()
    },
  }
}
