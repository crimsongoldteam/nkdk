import { describe, expect, it, vi } from "vitest"
import { syncToXml } from "./syncToXml"

describe("syncToXml service", () => {
  it("requires allowWrite before calling core", async () => {
    const syncConfigurationToXML = vi.fn()
    const result = await syncToXml({ yamlDir: "/yaml", xmlDir: "/xml" }, { syncConfigurationToXML })

    expect(result).toEqual({
      ok: false,
      code: "confirmation_required",
      message: "sync_to_xml пишет XML-файлы; повторите вызов с allowWrite=true",
      details: { yamlDir: "/yaml", xmlDir: "/xml", referenceDir: undefined },
    })
    expect(syncConfigurationToXML).not.toHaveBeenCalled()
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
      { yamlDir: "/yaml", xmlDir: "/xml", referenceDir: "/reference", allowWrite: true },
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
