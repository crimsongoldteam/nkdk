import { describe, expect, it } from "vitest"
import { runProjectStateStoreContract } from "../storeContract"
import { encodeProjectStateFileUpdateBatch } from "./contribution"
import { createBinaryProjectStateTestFixture } from "./testFixture"
import { yamlUpdate } from "./testData"
import { createProjectStateFragmentWriter } from "./fragment"

describe("BinaryProjectStateStore", () => {
  runProjectStateStoreContract(() => createBinaryProjectStateTestFixture())

  it("не меняет уже выданный снимок при чтении кандидата и откате", () => {
    const { store, openReadSession } = createBinaryProjectStateTestFixture()
    const initial = yamlUpdate("cf/Исходный.yaml", "cf", "Catalog.Исходный")
    const candidate = yamlUpdate("cf/Новый.yaml", "cf", "Catalog.Новый")
    store.beginUpdate()
    store.replaceFiles(encodeProjectStateFileUpdateBatch({ updates: [initial], hashBytes: new Uint8Array(8) }))
    store.commitUpdate()
    const publishedToken = store.createReadToken()

    store.beginUpdate()
    store.replaceFiles(encodeProjectStateFileUpdateBatch({ updates: [candidate], hashBytes: new Uint8Array(8) }))
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
})
