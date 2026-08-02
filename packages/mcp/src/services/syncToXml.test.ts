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
      configurationIndexPath: "/yaml/.nkdk/components/cf/configuration-index.bin",
    })
    const syncConfigurationToXML = vi.fn()
    const result = await syncToXml(
      { projectDir, componentPath: "cf", xmlDir: "/xml" },
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
      componentPath: "cf",
      xmlDir: "/xml",
    })
    expect(syncConfigurationToXML).not.toHaveBeenCalled()
  })

  it("uses full sync through the configuration index when writing is allowed", async () => {
    const projectDir = createProject()
    const syncConfigurationToXML = vi.fn().mockResolvedValue({
      succeeded: 1,
      failed: [],
      warnings: [],
      configurationIndexPath: "/yaml/.nkdk/components/cf/configuration-index.bin",
    })

    const result = await syncToXml(
      { projectDir, componentPath: "cf", xmlDir: "/xml", allowWrite: true, concurrency: 4 },
      { syncConfigurationToXML },
    )

    expect(syncConfigurationToXML).toHaveBeenCalledWith(
      expect.objectContaining({
        projectDir,
        componentPath: "cf",
        xmlDir: "/xml",
        concurrency: 4,
      }),
    )
    expect(result).toEqual({
      ok: true,
      succeeded: 1,
      configurationIndexPath: "/yaml/.nkdk/components/cf/configuration-index.bin",
      warnings: [],
      failed: [],
    })
  })

  it("closes the temporary project state after sync", async () => {
    const projectDir = createProject()
    const close = vi.fn(async () => undefined)
    const projectState = {
      beginImport: vi.fn(),
      refreshAndValidate: vi.fn(),
      createReadToken: vi.fn(),
      openReadSession: vi.fn(),
      readComponentProjection: vi.fn(),
      reset: vi.fn(),
      rebuild: vi.fn(),
      close,
    }
    const syncConfigurationToXML = vi.fn().mockResolvedValue({ succeeded: 0, failed: [], warnings: [] })

    await syncToXml(
      { projectDir, componentPath: "cf", xmlDir: "/xml", allowWrite: true },
      { createProjectStateService: () => projectState, syncConfigurationToXML },
    )

    expect(syncConfigurationToXML).toHaveBeenCalledWith(expect.objectContaining({ projectState }))
    expect(close).toHaveBeenCalledOnce()
  })

  it.each([false, true])(
    "routes cfe to the common coordinator in %s write mode",
    async (allowWrite) => {
      const projectDir = createProject()
      const planSyncToXml = vi.fn().mockResolvedValue({
        ok: true,
        mode: "plan",
        assignments: 1,
        externalFiles: 0,
        configurationIndexPath:
          "/yaml/.nkdk/components/cfe/Расширение/configuration-index.bin",
      })
      const syncConfigurationToXML = vi.fn().mockResolvedValue({
        succeeded: 1,
        failed: [],
        warnings: [],
        configurationIndexPath:
          "/yaml/.nkdk/components/cfe/Расширение/configuration-index.bin",
      })

      const result = await syncToXml({
        projectDir,
        componentPath: "cfe/Расширение",
        xmlDir: "/xml",
        allowWrite,
      }, { planSyncToXml, syncConfigurationToXML })

      const expected = {
        projectDir,
        componentPath: "cfe/Расширение",
        xmlDir: "/xml",
      }
      if (allowWrite) {
        expect(syncConfigurationToXML).toHaveBeenCalledWith(
          expect.objectContaining(expected)
        )
        expect(planSyncToXml).not.toHaveBeenCalled()
        expect(result).toMatchObject({
          ok: true,
          configurationIndexPath:
            "/yaml/.nkdk/components/cfe/Расширение/configuration-index.bin",
        })
      } else {
        expect(planSyncToXml).toHaveBeenCalledWith(expected)
        expect(syncConfigurationToXML).not.toHaveBeenCalled()
        expect(result).toMatchObject({
          ok: true,
          result: {
            configurationIndexPath:
              "/yaml/.nkdk/components/cfe/Расширение/configuration-index.bin",
          },
        })
      }
    }
  )

  it("rejects cfe without a component name", async () => {
    const projectDir = createProject()
    const syncConfigurationToXML = vi.fn()

    const result = await syncToXml({
      projectDir,
      componentPath: "cfe",
      xmlDir: "/xml",
      allowWrite: true,
    }, { syncConfigurationToXML })

    expect(result).toEqual({
      ok: false,
      code: "invalid_arguments",
      message: "Ожидался путь cfe/<Имя>",
      details: { componentPath: "cfe" },
    })
    expect(syncConfigurationToXML).not.toHaveBeenCalled()
  })

  it("rejects a component path without the matching directory", async () => {
    const projectDir = createProject()
    const syncConfigurationToXML = vi.fn()

    const result = await syncToXml({
      projectDir,
      componentPath: "cfe/Другое",
      xmlDir: "/xml",
      allowWrite: true,
    }, { syncConfigurationToXML })

    expect(result).toMatchObject({
      ok: false,
      code: "not_found",
      details: { projectDir, componentPath: "cfe/Другое" },
    })
    expect(syncConfigurationToXML).not.toHaveBeenCalled()
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
