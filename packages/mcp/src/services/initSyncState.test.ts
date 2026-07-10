import { describe, expect, it, vi } from "vitest"
import { initSyncState } from "./initSyncState"

describe("initSyncState service", () => {
  it("requires allowWrite before calling core", async () => {
    const initializeXmlSyncState = vi.fn()
    const result = await initSyncState({ yamlDir: "/yaml", xmlDir: "/xml" }, { initializeXmlSyncState })

    expect(result).toEqual({
      ok: false,
      code: "confirmation_required",
      message: "init_sync_state пишет .nkdk-sync.yaml; повторите вызов с allowWrite=true",
      details: { yamlDir: "/yaml", xmlDir: "/xml" },
    })
    expect(initializeXmlSyncState).not.toHaveBeenCalled()
  })

  it("initializes state through core", async () => {
    const initializeXmlSyncState = vi.fn().mockResolvedValue(undefined)
    const result = await initSyncState({ yamlDir: "/yaml", xmlDir: "/xml", allowWrite: true }, { initializeXmlSyncState })

    expect(initializeXmlSyncState).toHaveBeenCalledWith(expect.objectContaining({
      yamlDir: "/yaml",
      xmlDir: "/xml",
    }))
    expect(result).toEqual({ ok: true, stateFile: ".nkdk-sync.yaml" })
  })
})
