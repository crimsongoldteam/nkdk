import { describe, expect, it, vi } from "vitest"
import { importFromXml } from "./importFromXml"

describe("importFromXml service", () => {
  it("requires allowWrite before calling core", async () => {
    const syncConfigurationFromXML = vi.fn()
    const result = await importFromXml({ xmlDir: "/xml", yamlDir: "/yaml" }, { syncConfigurationFromXML })

    expect(result).toEqual({
      ok: false,
      code: "confirmation_required",
      message: "import_from_xml пишет YAML-файлы; повторите вызов с allowWrite=true",
      details: { xmlDir: "/xml", yamlDir: "/yaml" },
    })
    expect(syncConfigurationFromXML).not.toHaveBeenCalled()
  })

  it("maps core partial failures to stable JSON", async () => {
    const syncConfigurationFromXML = vi.fn().mockResolvedValue({
      succeeded: 1,
      failed: [
        {
          kind: "Enum",
          name: "Виды",
          parent: undefined,
          error: new Error("broken xml"),
        },
      ],
    })

    const result = await importFromXml({ xmlDir: "/xml", yamlDir: "/yaml", allowWrite: true }, { syncConfigurationFromXML })

    expect(syncConfigurationFromXML).toHaveBeenCalledWith({
      context: {
        defaultLanguage: "ru",
        version: "2.20",
        exportToYAML: { toTyped: false },
        fromXML: { forReference: false },
      },
      inputDir: "/xml",
      outputDir: "/yaml",
    })
    expect(result).toEqual({
      ok: true,
      succeeded: 1,
      failed: [{ kind: "Enum", name: "Виды", message: "broken xml" }],
    })
  })
})
