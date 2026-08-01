import { expect, it } from "vitest"
import { Worker } from "node:worker_threads"
import type { ProjectStateYamlFileUpdate } from "../fileUpdate"
import { ProjectStateReadSessionClosedError } from "../readSession"
import { sourceWorkerExecArgv } from "../../sourceWorkerRuntime"
import { openSqliteProjectStateReadSession } from "./readSession"
import type { SqliteProjectStateStoreFixture } from "./store"
import { createSqliteProjectStateTestFixture } from "./testFixture"

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

  const result = await runReadSessionWorker(token)

  expect(result).toEqual({
    requestId: "worker",
    status: "found",
    target: { kind: "object", canonical: "Catalog.Товары" },
  })
  expect(() => fixture.openReadSession(token)).toThrow()
})

it("атомарно заявляет tokenNonce при передаче независимой копии token в worker thread", async () => {
  const fixture = createSqliteProjectStateTestFixture()
  const token = fixture.store.createReadToken()
  const tokenCopy = new Uint8Array(new SharedArrayBuffer(token.byteLength))
  tokenCopy.set(token)

  await runReadSessionWorker(tokenCopy)

  expect(() => fixture.openReadSession(token)).toThrow()
})

it("координированно закрывает внешний worker-сеанс вместе с хранилищем", async () => {
  const fixture = createSqliteProjectStateTestFixture()
  const closed = waitForWorkerSessionClose(fixture.store.createReadToken())
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

function runReadSessionWorker(token: Uint8Array): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./readSession.testWorker.ts", import.meta.url), {
      workerData: { token },
      execArgv: sourceWorkerExecArgv(),
    })
    worker.once("message", resolve)
    worker.once("error", reject)
    worker.once("exit", (code) => {
      if (code !== 0) reject(new Error(`SQLite read session worker завершился с кодом ${code}`))
    })
  })
}

function waitForWorkerSessionClose(token: Uint8Array): {
  readonly opened: Promise<void>
  readonly result: Promise<unknown>
} {
  let resolveOpened!: () => void
  const opened = new Promise<void>((resolve) => {
    resolveOpened = resolve
  })
  const result = new Promise<unknown>((resolve, reject) => {
    const worker = new Worker(new URL("./readSession.testWorker.ts", import.meta.url), {
      workerData: { token, waitForClose: true },
      execArgv: sourceWorkerExecArgv(),
    })
    const timeout = setTimeout(() => {
      void worker.terminate()
      reject(new Error("Worker-сеанс не закрылся вместе с хранилищем"))
    }, 1_000)
    worker.on("message", (message) => {
      if (message === "opened") {
        resolveOpened()
        return
      }
      clearTimeout(timeout)
      resolve(message)
    })
    worker.once("error", reject)
    worker.once("exit", (code) => {
      if (code !== 0) reject(new Error(`SQLite read session worker завершился с кодом ${code}`))
    })
  })
  return { opened, result }
}
