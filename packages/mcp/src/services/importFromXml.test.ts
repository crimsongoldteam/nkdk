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

  it("maps XML-import diagnostics to stable JSON", async () => {
    const syncConfigurationFromXML = vi.fn().mockResolvedValue({
      succeeded: 1,
      failed: [
        {
          severity: "error",
          code: "xml_import_assignment_failed",
          message: "broken xml",
          targetProjectPath: "Перечисление/Виды/Свойства.yaml",
          sourcePath: "/xml/Enums/Виды.xml",
        },
      ],
      warnings: [],
      preservedTempRoot: "/yaml/.nkdk/tmp/import/operation-1",
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
      failed: [
        {
          kind: "xml_import_assignment_failed",
          name: "Перечисление/Виды/Свойства.yaml",
          message: "broken xml",
        },
      ],
      warnings: [],
      preservedTempRoot: "/yaml/.nkdk/tmp/import/operation-1",
    })
  })

  it("returns warnings and configuration index path", async () => {
    const syncConfigurationFromXML = vi.fn().mockResolvedValue({
      succeeded: 1,
      failed: [],
      warnings: [
        {
          severity: "warning",
          code: "unresolved_data_path",
          message: "path",
          targetProjectPath: "Форма.yaml",
        },
      ],
      configurationIndexPath: "/yaml/.nkdk/configuration-index/default.bin",
    })

    const result = await importFromXml(
      { xmlDir: "/xml", yamlDir: "/yaml", allowWrite: true },
      { syncConfigurationFromXML }
    )

    expect(result).toEqual({
      ok: true,
      succeeded: 1,
      failed: [],
      warnings: [
        {
          code: "unresolved_data_path",
          message: "path",
          targetProjectPath: "Форма.yaml",
        },
      ],
      configurationIndexPath: "/yaml/.nkdk/configuration-index/default.bin",
    })
  })
})
