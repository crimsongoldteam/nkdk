import { describe, expect, it, vi } from "vitest"
import { syncToXml } from "./syncToXml"

describe("syncToXml service", () => {
  it("returns migration plan without writing when allowWrite is not true", async () => {
    const planSyncToXml = vi.fn().mockResolvedValue({
      ok: true,
      mode: "plan",
      migrationsToApply: [],
    })
    const syncConfigurationToXML = vi.fn()
    const result = await syncToXml({ yamlDir: "/yaml", xmlDir: "/xml" }, { planSyncToXml, syncConfigurationToXML })

    expect(result).toMatchObject({
      ok: true,
      result: {
        mode: "plan",
        migrationsToApply: [],
      },
    })
    expect(planSyncToXml).toHaveBeenCalledWith({
      inputDir: "/yaml",
      outputDir: "/xml",
      referenceDir: "/xml",
    })
    expect(syncConfigurationToXML).not.toHaveBeenCalled()
  })

  it("asks to initialize state before incremental sync", async () => {
    const readXmlSyncState = vi.fn().mockResolvedValue(undefined)
    const syncConfigurationToXML = vi.fn()
    const syncConfigurationIncrementallyToXML = vi.fn()

    const result = await syncToXml(
      { yamlDir: "/yaml", xmlDir: "/xml", allowWrite: true },
      { readXmlSyncState, syncConfigurationToXML, syncConfigurationIncrementallyToXML },
    )

    expect(result).toEqual({
      ok: false,
      code: "sync_state_required",
      message:
        "Файл .nkdk-sync.yaml не найден; вызовите nkdk.init_sync_state перед инкрементальной синхронизацией или явно запросите fullSync=true",
      details: { yamlDir: "/yaml", xmlDir: "/xml", tool: "nkdk.init_sync_state" },
    })
    expect(syncConfigurationIncrementallyToXML).not.toHaveBeenCalled()
    expect(syncConfigurationToXML).not.toHaveBeenCalled()
  })

  it("uses incremental sync when state exists", async () => {
    const readXmlSyncState = vi.fn().mockResolvedValue({ version: 1, files: {} })
    const syncConfigurationToXML = vi.fn()
    const syncConfigurationIncrementallyToXML = vi.fn().mockResolvedValue({
      succeeded: 1,
      failed: [],
    })

    const result = await syncToXml(
      { yamlDir: "/yaml", xmlDir: "/xml", allowWrite: true },
      { readXmlSyncState, syncConfigurationToXML, syncConfigurationIncrementallyToXML },
    )

    expect(syncConfigurationIncrementallyToXML).toHaveBeenCalledWith(
      expect.objectContaining({
        inputDir: "/yaml",
        outputDir: "/xml",
        referenceDir: "/xml",
      }),
    )
    expect(syncConfigurationToXML).not.toHaveBeenCalled()
    expect(result).toEqual({
      ok: true,
      succeeded: 1,
      failed: [],
    })
  })

  it("uses full sync only when fullSync is explicit", async () => {
    const syncConfigurationToXML = vi.fn().mockResolvedValue({
      succeeded: 1,
      failed: [],
    })

    const result = await syncToXml(
      { yamlDir: "/yaml", xmlDir: "/xml", allowWrite: true, fullSync: true },
      { syncConfigurationToXML },
    )

    expect(syncConfigurationToXML).toHaveBeenCalledWith(
      expect.objectContaining({
        inputDir: "/yaml",
        outputDir: "/xml",
        referenceDir: "/xml",
      }),
    )
    expect(result).toEqual({
      ok: true,
      succeeded: 1,
      failed: [],
    })
  })

  it("passes referenceDir and maps failures", async () => {
    const syncConfigurationToXML = vi.fn().mockResolvedValue({
      succeeded: 2,
      failed: [
        {
          kind: "Catalog",
          name: "Товары",
          parent: "Справочники",
          error: new Error("bad yaml"),
        },
      ],
    })

    const result = await syncToXml(
      { yamlDir: "/yaml", xmlDir: "/xml", referenceDir: "/reference", allowWrite: true, fullSync: true },
      { syncConfigurationToXML },
    )

    expect(syncConfigurationToXML).toHaveBeenCalledWith(
      expect.objectContaining({
        inputDir: "/yaml",
        outputDir: "/xml",
        referenceDir: "/reference",
      }),
    )
    expect(result).toEqual({
      ok: true,
      succeeded: 2,
      failed: [{ kind: "Catalog", name: "Товары", parent: "Справочники", message: "bad yaml" }],
    })
  })
})
