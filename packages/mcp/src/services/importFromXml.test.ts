import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { afterEach, describe, expect, it, vi } from "vitest"
import { importFromXml } from "./importFromXml"

describe("importFromXml service", () => {
  const tempDirs: string[] = []

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
  })

  it("requires allowWrite before calling core", async () => {
    const projectDir = createProject()
    const syncConfigurationFromXML = vi.fn()
    const result = await importFromXml({ xmlDir: "/xml", projectDir }, { syncConfigurationFromXML })

    expect(result).toEqual({
      ok: false,
      code: "confirmation_required",
      message: "import_from_xml пишет YAML-файлы; повторите вызов с allowWrite=true",
      details: { xmlDir: "/xml", projectDir, componentPath: "cf" },
    })
    expect(syncConfigurationFromXML).not.toHaveBeenCalled()
  })

  it("imports selected empty component and maps XML-import diagnostics to stable JSON", async () => {
    const projectDir = createProject()
    const componentDir = join(projectDir, "cfe", "Расширение")
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

    const result = await importFromXml(
      { xmlDir: "/xml", projectDir, componentPath: "cfe/Расширение", allowWrite: true },
      { syncConfigurationFromXML },
    )

    expect(syncConfigurationFromXML).toHaveBeenCalledWith({
      context: {
        defaultLanguage: "ru",
        version: "2.20",
        exportToYAML: { toTyped: false },
        fromXML: { forReference: false },
      },
      inputDir: "/xml",
      outputDir: componentDir,
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

  it("refuses to import into non-empty component", async () => {
    const projectDir = createProject()
    writeFileSync(join(projectDir, "cf", "Configuration.yaml"), "name: Test\n")
    const syncConfigurationFromXML = vi.fn()

    const result = await importFromXml({ xmlDir: "/xml", projectDir, allowWrite: true }, { syncConfigurationFromXML })

    expect(result).toMatchObject({
      ok: false,
      code: "invalid_arguments",
    })
    expect(syncConfigurationFromXML).not.toHaveBeenCalled()
  })

  it("returns warnings and configuration index path", async () => {
    const projectDir = createProject()
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
      { xmlDir: "/xml", projectDir, componentPath: "epf/Загрузка", allowWrite: true },
      { syncConfigurationFromXML },
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

  function createProject(): string {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-mcp-import-"))
    tempDirs.push(projectDir)
    mkdirSync(join(projectDir, "cf"), { recursive: true })
    return projectDir
  }
})
