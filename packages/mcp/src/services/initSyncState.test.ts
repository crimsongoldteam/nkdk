import { mkdirSync, mkdtempSync, rmSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { afterEach, describe, expect, it, vi } from "vitest"
import { initSyncState } from "./initSyncState"

describe("initSyncState service", () => {
  const tempDirs: string[] = []

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
  })

  it("requires allowWrite before calling core", async () => {
    const projectDir = createProject()
    const initializeXmlSyncState = vi.fn()
    const result = await initSyncState({ projectDir, xmlDir: "/xml" }, { initializeXmlSyncState })

    expect(result).toEqual({
      ok: false,
      code: "confirmation_required",
      message: "init_sync_state пишет .nkdk-sync.yaml; повторите вызов с allowWrite=true",
      details: { projectDir, componentPath: "cf", xmlDir: "/xml" },
    })
    expect(initializeXmlSyncState).not.toHaveBeenCalled()
  })

  it("initializes state through core", async () => {
    const projectDir = createProject()
    const initializeXmlSyncState = vi.fn().mockResolvedValue(undefined)
    const result = await initSyncState(
      { projectDir, componentPath: "cfe/Расширение", xmlDir: "/xml", allowWrite: true },
      { initializeXmlSyncState },
    )

    expect(initializeXmlSyncState).toHaveBeenCalledWith(expect.objectContaining({
      yamlDir: join(projectDir, "cfe", "Расширение"),
      xmlDir: "/xml",
    }))
    expect(result).toEqual({ ok: true, stateFile: ".nkdk-sync.yaml" })
  })

  function createProject(): string {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-mcp-init-sync-"))
    tempDirs.push(projectDir)
    mkdirSync(join(projectDir, "cf"), { recursive: true })
    mkdirSync(join(projectDir, "cfe", "Расширение"), { recursive: true })
    return projectDir
  }
})
