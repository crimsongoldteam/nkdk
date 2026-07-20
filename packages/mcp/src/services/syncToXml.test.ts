import { describe, expect, it, vi } from "vitest"
import { syncToXml } from "./syncToXml"

describe("syncToXml service", () => {
  it("returns a full XML sync plan without writing when allowWrite is not true", async () => {
    const planSyncToXml = vi.fn().mockResolvedValue({
      ok: true,
      mode: "plan",
      assignments: 2,
      externalFiles: 1,
      configurationIndexPath: "/yaml/.nkdk/configuration-index/default.bin",
    })
    const syncConfigurationToXML = vi.fn()
    const result = await syncToXml({ yamlDir: "/yaml", xmlDir: "/xml", baseId: "default" }, { planSyncToXml, syncConfigurationToXML })

    expect(result).toMatchObject({
      ok: true,
      result: {
        mode: "plan",
        assignments: 2,
        externalFiles: 1,
      },
    })
    expect(planSyncToXml).toHaveBeenCalledWith({
      yamlDir: "/yaml",
      xmlDir: "/xml",
      baseId: "default",
    })
    expect(syncConfigurationToXML).not.toHaveBeenCalled()
  })

  it("uses full sync through the configuration index when writing is allowed", async () => {
    const syncConfigurationToXML = vi.fn().mockResolvedValue({
      succeeded: 1,
      failed: [],
      warnings: [],
      configurationIndexPath: "/yaml/.nkdk/configuration-index/default.bin",
    })

    const result = await syncToXml(
      { yamlDir: "/yaml", xmlDir: "/xml", allowWrite: true, baseId: "default", concurrency: 4 },
      { syncConfigurationToXML },
    )

    expect(syncConfigurationToXML).toHaveBeenCalledWith(
      expect.objectContaining({
        yamlDir: "/yaml",
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
    const syncConfigurationToXML = vi.fn().mockResolvedValue({
      succeeded: 2,
      failed: [{ severity: "error", code: "bad_yaml", message: "bad yaml" }],
      warnings: [{ severity: "warning", code: "data_path", message: "ПутьКДанным не преобразован" }],
    })

    const result = await syncToXml(
      { yamlDir: "/yaml", xmlDir: "/xml", allowWrite: true },
      { syncConfigurationToXML },
    )

    expect(result).toEqual({
      ok: true,
      succeeded: 2,
      warnings: [{ severity: "warning", code: "data_path", message: "ПутьКДанным не преобразован" }],
      failed: [{ severity: "error", code: "bad_yaml", message: "bad yaml" }],
    })
  })
})
