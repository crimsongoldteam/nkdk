import { afterEach, expect, it } from "vitest"
import { Worker } from "node:worker_threads"
import type { ProjectStateYamlFileUpdate } from "../fileUpdate"
import { sourceWorkerExecArgv } from "../../sourceWorkerRuntime"
import { createSqliteProjectStateStore, type SqliteProjectStateStoreFixture } from "./store"

const compatibility = { formatVersion: 1, coreVersion: "test" }
const fixtures: SqliteProjectStateStoreFixture[] = []

afterEach(() => {
  for (const fixture of fixtures.splice(0)) fixture.store.close()
})

it("изолирует временные пакеты двух read session одной именованной базы", () => {
  const fixture = createFixture()
  const update = yaml("cf/Товары.yaml", "Catalog.Товары")
  fixture.store.beginUpdate()
  fixture.store.replaceFiles({ updates: [update], hashBytes: new Uint8Array(8) })
  fixture.store.commitUpdate()

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
  const first = createFixture()
  const second = createFixture()
  const foreignToken = first.store.createReadToken()

  expect(() => second.openReadSession(foreignToken)).toThrow()
})

it("отвергает повторное открытие token после закрытия соответствующего сеанса", () => {
  const fixture = createFixture()
  const token = fixture.store.createReadToken()
  const session = fixture.openReadSession(token)
  session.close()

  expect(() => fixture.openReadSession(token)).toThrow()
})

it("проверяет и одноразово закрывает token в отдельном worker thread", async () => {
  const fixture = createFixture()
  const update = yaml("cf/Товары.yaml", "Catalog.Товары")
  fixture.store.beginUpdate()
  fixture.store.replaceFiles({ updates: [update], hashBytes: new Uint8Array(8) })
  fixture.store.commitUpdate()
  const token = fixture.store.createReadToken()

  const result = await runReadSessionWorker(token)

  expect(result).toEqual({
    requestId: "worker",
    status: "found",
    target: { kind: "object", canonical: "Catalog.Товары" },
  })
  expect(() => fixture.openReadSession(token)).toThrow()
})

function createFixture(): SqliteProjectStateStoreFixture {
  const fixture = createSqliteProjectStateStore({ projectDir: "/project", compatibility })
  fixtures.push(fixture)
  return fixture
}

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
