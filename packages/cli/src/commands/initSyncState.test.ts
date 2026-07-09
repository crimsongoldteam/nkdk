import { initializeXmlSyncState } from "@nkdk/core"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { initSyncState } from "./initSyncState"

const mocks = vi.hoisted(() => ({
  initializeXmlSyncState: vi.fn(async () => undefined),
}))

vi.mock("@nkdk/core", () => ({
  initializeXmlSyncState: mocks.initializeXmlSyncState,
}))

describe("init-sync-state command", () => {
  beforeEach(() => {
    mocks.initializeXmlSyncState.mockClear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("создает файл состояния через публичный вход core", async () => {
    vi.spyOn(process.stdout, "write").mockImplementation(() => true)

    await initSyncState("yaml", "xml")

    expect(initializeXmlSyncState).toHaveBeenCalledWith(expect.objectContaining({
      yamlDir: "yaml",
      xmlDir: "xml",
    }))
  })
})
