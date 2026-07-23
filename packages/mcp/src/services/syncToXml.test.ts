import { mkdirSync, mkdtempSync, rmSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { afterEach, describe, expect, it, vi } from "vitest"
import { syncToXml } from "./syncToXml"

describe("syncToXml service", () => {
  const tempDirs: string[] = []

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
  })

  it("returns a full XML sync plan without writing when allowWrite is not true", async () => {
    const projectDir = createProject()
    const planSyncToXml = vi.fn().mockResolvedValue({
      ok: true,
      mode: "plan",
      assignments: 2,
      externalFiles: 1,
      configurationIndexPath: "/yaml/.nkdk/configuration-index/default.bin",
    })
    const syncConfigurationToXML = vi.fn()
    const result = await syncToXml(
      { projectDir, componentPath: "cfe/Расширение", xmlDir: "/xml", baseId: "default" },
      { planSyncToXml, syncConfigurationToXML },
    )

    expect(result).toMatchObject({
      ok: true,
      result: {
        mode: "plan",
        assignments: 2,
        externalFiles: 1,
      },
    })
    expect(planSyncToXml).toHaveBeenCalledWith({
      projectDir,
      yamlDir: join(projectDir, "cfe", "Расширение"),
      xmlDir: "/xml",
      baseId: "default",
    })
    expect(syncConfigurationToXML).not.toHaveBeenCalled()
  })

  it("uses full sync through the configuration index when writing is allowed", async () => {
    const projectDir = createProject()
    const syncConfigurationToXML = vi.fn().mockResolvedValue({
      succeeded: 1,
      failed: [],
      warnings: [],
      configurationIndexPath: "/yaml/.nkdk/configuration-index/default.bin",
    })

    const result = await syncToXml(
      { projectDir, componentPath: "cfe/Расширение", xmlDir: "/xml", allowWrite: true, baseId: "default", concurrency: 4 },
      { syncConfigurationToXML },
    )

    expect(syncConfigurationToXML).toHaveBeenCalledWith(
      expect.objectContaining({
        projectDir,
        yamlDir: join(projectDir, "cfe", "Расширение"),
        xmlDir: "/xml",
        baseId: "default",
        concurrency: 4,
      }),
    )
    expect(result).toEqual({
      ok: true,
      succeeded: 1,
      configurationIndexPath: "/yaml/.nkdk/configuration-index/default.bin",
      warnings: [],
      failed: [],
    })
  })

  it("maps diagnostics from the new full sync result", async () => {
    const projectDir = createProject()
    const syncConfigurationToXML = vi.fn().mockResolvedValue({
      succeeded: 2,
      failed: [{ severity: "error", code: "bad_yaml", message: "bad yaml" }],
      warnings: [{ severity: "warning", code: "data_path", message: "ПутьКДанным не преобразован" }],
    })

    const result = await syncToXml(
      { projectDir, xmlDir: "/xml", allowWrite: true },
      { syncConfigurationToXML },
    )

    expect(result).toEqual({
      ok: true,
      succeeded: 2,
      warnings: [{ severity: "warning", code: "data_path", message: "ПутьКДанным не преобразован" }],
      failed: [{ severity: "error", code: "bad_yaml", message: "bad yaml" }],
    })
  })

  function createProject(): string {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-mcp-sync-"))
    tempDirs.push(projectDir)
    mkdirSync(join(projectDir, "cf"), { recursive: true })
    mkdirSync(join(projectDir, "cfe", "Расширение"), { recursive: true })
    return projectDir
  }
})
