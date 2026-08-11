import { describe, expect, it, vi } from "vitest"
import { runProjectStateStoreContract } from "../storeContract"
import { createBinaryProjectStateTestFixture } from "./testFixture"
import { yamlUpdate } from "./testData"
import { createProjectStateFragmentWriter } from "./fragment"
import { PROJECT_STATE_FACT_RECORD_VIEWS } from "./factTables"

describe("BinaryProjectStateStore", () => {
  runProjectStateStoreContract(() => createBinaryProjectStateTestFixture())

  it("не меняет уже выданный снимок при чтении кандидата и откате", () => {
    const { store, openReadSession } = createBinaryProjectStateTestFixture()
    const initial = yamlUpdate("cf/Исходный.yaml", "cf", "Catalog.Исходный")
    const candidate = yamlUpdate("cf/Новый.yaml", "cf", "Catalog.Новый")
    store.beginUpdate()
    append(store, initial)
    store.commitUpdate()
    const publishedToken = store.createReadToken()

    store.beginUpdate()
    append(store, candidate)
    const candidateSession = openReadSession(store.createReadToken())
    expect(candidateSession.resolveTargets([{
      requestId: "candidate",
      componentPath: "cf",
      canonicalTarget: "Catalog.Новый",
    }])[0]).toMatchObject({ status: "found" })
    candidateSession.close()
    store.rollbackUpdate()

    const publishedSession = openReadSession(publishedToken)
    expect(publishedSession.resolveTargets([{
      requestId: "published",
      componentPath: "cf",
      canonicalTarget: "Catalog.Новый",
    }])).toEqual([{ requestId: "published", status: "missing" }])
    publishedSession.close()
    expect(store.readComponentProjection("cf").updates).toEqual([initial])
  })

  it("принимает непрозрачный фрагмент и публикует его одной заменой", () => {
    const { store, openReadSession } = createBinaryProjectStateTestFixture()
    const update = yamlUpdate("cf/Новый.yaml", "cf", "Catalog.Новый")
    const writer = createProjectStateFragmentWriter()
    writer.appendFile(update, 7n)

    store.beginUpdate()
    store.appendFragment(writer.finish())
    store.commitUpdate()

    const session = openReadSession(store.createReadToken())
    expect(session.resolveTargets([{
      requestId: "new", componentPath: "cf", canonicalTarget: "Catalog.Новый",
    }])[0]).toMatchObject({ status: "found" })
    session.close()
    expect(store.readComponentProjection("cf").updates).toEqual([update])
  })

  it("отвергает повреждённый фрагмент до публикации", () => {
    const { store } = createBinaryProjectStateTestFixture()
    const writer = createProjectStateFragmentWriter()
    writer.appendFile(yamlUpdate("cf/Новый.yaml", "cf", "Catalog.Новый"), 7n)
    const fragment = writer.finish()
    new Uint8Array(fragment.buffers.header)[0] ^= 0xff

    store.beginUpdate()
    expect(() => store.appendFragment(fragment)).toThrow(/сигнатур/iu)
    store.rollbackUpdate()

    expect(store.compareFiles({ files: [], hashBytes: new Uint8Array() })).toEqual({ changed: [], deleted: [] })
  })

  it("читает baseline страницами и удаляет только неотмеченные прежние файлы", () => {
    const { store } = createBinaryProjectStateTestFixture()
    const first = yamlUpdate("cf/Первый.yaml", "cf", "Catalog.Первый")
    const second = yamlUpdate("cf/Второй.yaml", "cf", "Catalog.Второй")
    const writer = createProjectStateFragmentWriter()
    writer.appendFile(first, 11n)
    writer.appendFile(second, 12n)
    store.beginUpdate()
    store.appendFragment(writer.finish())
    expect(store.commitUpdate()).toBe(true)

    const pathPage = store.readFileBaselinePathPage([first.projectPath, "cf/Новый.yaml"])
    expect(pathPage.storedFileCount).toBe(2)
    expect(pathPage.knownHashBits).toEqual(Uint8Array.of(0b0000_0001))
    expect(pathPage.previousFileIds[0]).toBeGreaterThanOrEqual(0)
    expect(Array.from(pathPage.previousFileIds)).toEqual([pathPage.previousFileIds[0], -1])
    expect(new DataView(pathPage.hashBytes.buffer).getBigUint64(0, false)).toBe(11n)

    store.beginUpdate()
    const seen = new Uint8Array(1)
    seen[0] = 1 << pathPage.previousFileIds[0]!
    expect(store.deleteUnseenFiles(seen)).toBe(1)
    expect(store.commitUpdate()).toBe(true)
    expect(store.readComponentProjection("cf").updates).toEqual([first])

    store.beginUpdate()
    expect(store.commitUpdate()).toBe(false)
  })

  it("переиспользует разбиение двоичных записей между чтениями снимка", () => {
    const { store } = createBinaryProjectStateTestFixture()
    store.beginUpdate()
    append(store, yamlUpdate("cf/Объект.yaml", "cf", "Catalog.Объект"))
    store.commitUpdate()
    const decode = vi.spyOn(PROJECT_STATE_FACT_RECORD_VIEWS.validationStatus, "decode")

    store.readLocalDiagnostics()
    const firstRead = decode.mock.calls.length
    decode.mockClear()
    store.readLocalDiagnostics()

    expect(decode.mock.calls.length).toBeLessThan(firstRead)
  })
})

function append(store: ReturnType<typeof createBinaryProjectStateTestFixture>["store"], update: ReturnType<typeof yamlUpdate>): void {
  const writer = createProjectStateFragmentWriter()
  writer.appendFile(update, 0n)
  store.appendFragment(writer.finish())
}
