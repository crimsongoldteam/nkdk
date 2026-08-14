import { describe, expect, it, vi } from "vitest"
import { buildProjectStateSnapshot } from "../projectState/binary/builder"
import { createBinaryProjectStateReadToken } from "../projectState/binary/readToken"
import { claimBinaryProjectStateReadToken } from "../projectState/binary/readToken"
import type { ProjectStateReadSession } from "../projectState/readSession"
import { createMetadataWorkerLineFactory } from "../../tests/metadataWorkerTestPool"
import { createMetadataWorkerPoolHandle } from "./handle"
import { createMetadataWorkerPersistentState } from "./workerState"

const context = { languages: { default: "ru", registered: ["ru"], registeredSet: new Set(["ru"]), version: '["ru",["ru"]]' }, version: "8.3.27" }

describe("состояние универсального worker", () => {
  it("восстанавливает индекс зарегистрированных языков после structured clone", async () => {
    const clonedContext = {
      ...context,
      languages: { ...context.languages, registeredSet: undefined },
    } as unknown as typeof context
    const state = await createMetadataWorkerPersistentState(
      { workerIndex: 0, context: clonedContext },
      {
        createSchemaCache: async () => ({}) as never,
        createRulesSnapshot: () => ({ version: 1, specs: [], items: [] }),
      },
    )

    expect(state.context.languages.registeredSet).toBeInstanceOf(Set)
    expect(state.context.languages.registeredSet.has("ru")).toBe(true)
  })

  it("устанавливает снимок в существующие и будущие линии, затем очищает его", async () => {
    const lines = createMetadataWorkerLineFactory()
    const handle = createMetadataWorkerPoolHandle({ createLine: lines.factory })
    const token = createBinaryProjectStateReadToken(buildProjectStateSnapshot({ fragments: [], deletions: [] }))

    await (await handle.beginOperation({ id: "first", concurrency: 1, context })).finish("success")
    await handle.installProjectState(token)
    await (await handle.beginOperation({ id: "second", concurrency: 2, context })).finish("success")

    expect(lines.commands(0).map(({ kind }) => kind)).toEqual([
      "initializeLine",
      "installProjectState",
    ])
    expect(lines.commands(1).map(({ kind }) => kind)).toEqual([
      "initializeLine",
      "installProjectState",
    ])

    await handle.clearProjectState()
    expect(lines.lastCommand(0)).toEqual({ kind: "clearProjectState" })
    expect(lines.lastCommand(1)).toEqual({ kind: "clearProjectState" })
  })

  it("сохраняет кэши и снимок при сбросе операции", async () => {
    const close = vi.fn()
    const openReadSession = vi.fn(() => ({ close }) as unknown as ProjectStateReadSession)
    const createSchemaCache = vi.fn(async () => ({ marker: "schema" }))
    const createRulesSnapshot = vi.fn(() => ({ version: 1 as const, specs: [], items: [] }))
    const state = await createMetadataWorkerPersistentState(
      { workerIndex: 0, context },
      {
        createSchemaCache: createSchemaCache as never,
        createRulesSnapshot,
        openReadSession,
      }
    )
    const token = createBinaryProjectStateReadToken(buildProjectStateSnapshot({ fragments: [], deletions: [] }))

    state.installProjectState(token)
    state.beginOperation("validation")
    state.resetOperation("validation")

    expect(createSchemaCache).toHaveBeenCalledTimes(1)
    expect(createRulesSnapshot).toHaveBeenCalledTimes(1)
    expect(openReadSession).toHaveBeenCalledTimes(1)
    expect(close).not.toHaveBeenCalled()

    state.clearProjectState()
    expect(close).toHaveBeenCalledTimes(1)
  })

  it("закрывает прежний снимок при его замене", async () => {
    const closes = [vi.fn(), vi.fn()]
    let sessionIndex = 0
    const state = await createMetadataWorkerPersistentState(
      { workerIndex: 0, context },
      {
        createSchemaCache: async () => ({}) as never,
        createRulesSnapshot: () => ({ version: 1, specs: [], items: [] }),
        openReadSession: () => ({ close: closes[sessionIndex++] }) as unknown as ProjectStateReadSession,
      }
    )
    const buffers = buildProjectStateSnapshot({ fragments: [], deletions: [] })

    state.installProjectState(createBinaryProjectStateReadToken(buffers))
    state.installProjectState(createBinaryProjectStateReadToken(buffers))

    expect(closes[0]).toHaveBeenCalledTimes(1)
    expect(closes[1]).not.toHaveBeenCalled()
  })

  it("не забирает у вызывающего кода право чтения установленного token", async () => {
    const lines = createMetadataWorkerLineFactory()
    const handle = createMetadataWorkerPoolHandle({ createLine: lines.factory })
    const buffers = buildProjectStateSnapshot({ fragments: [], deletions: [] })
    const published = createBinaryProjectStateReadToken(buffers)

    await handle.installProjectState(published)
    expect(claimBinaryProjectStateReadToken(published)).toBe(buffers)

    await (await handle.beginOperation({ id: "validation", concurrency: 1, context })).finish("success")
    expect(lines.commands(0).map(({ kind }) => kind)).toEqual([
      "initializeLine",
      "installProjectState",
    ])
  })
})
