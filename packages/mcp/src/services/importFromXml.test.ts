import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { afterEach, describe, expect, it, vi } from "vitest"
import { importFromXml } from "./importFromXml"

describe("importFromXml service", () => {
  const tempDirs: string[] = []

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
  })

  it("requires allowWrite before reading project or calling core", async () => {
    const importConfigurationFromXml = vi.fn()
    const result = await importFromXml(
      { xmlDir: "/xml", projectDir: "/missing/project", componentPath: "cfe/Расширение" },
      { importConfigurationFromXml },
    )

    expect(result).toEqual({
      ok: false,
      code: "confirmation_required",
      message: "import_from_xml пишет YAML-файлы; повторите вызов с allowWrite=true",
      details: { xmlDir: "/xml", projectDir: "/missing/project", componentPath: "cfe/Расширение" },
    })
    expect(importConfigurationFromXml).not.toHaveBeenCalled()
  })

  it("delegates extension selection to core and returns detected component path", async () => {
    const projectDir = createProject()
    const componentDir = join(projectDir, "cfe", "Расширение")
    const importConfigurationFromXml = vi.fn().mockResolvedValue({
      componentPath: "cfe/Расширение",
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
    })

    const result = await importFromXml(
      { xmlDir: "/xml", projectDir, allowWrite: true },
      { importConfigurationFromXml },
    )

    expect(importConfigurationFromXml).toHaveBeenCalledWith({
      context: {
        defaultLanguage: "ru",
        version: "2.20",
        exportToYAML: { toTyped: false },
        fromXML: { forReference: false },
      },
      inputDir: "/xml",
      projectDir,
    })
    expect(existsSync(componentDir)).toBe(false)
    expect(result).toEqual({
      ok: true,
      componentPath: "cfe/Расширение",
      succeeded: 1,
      failed: [
        {
          kind: "xml_import_assignment_failed",
          name: "Перечисление/Виды/Свойства.yaml",
          message: "broken xml",
        },
      ],
      warnings: [],
    })
  })

  it("returns core diagnostics as an error when component path was not detected", async () => {
    const projectDir = createProject()
    const importConfigurationFromXml = vi.fn().mockResolvedValue({
      succeeded: 0,
      failed: [
        {
          severity: "error",
          code: "xml_import_operation_failed",
          message: "Неизвестный корень Configuration.xml",
          targetProjectPath: "",
        },
      ],
      warnings: [],
    })

    const result = await importFromXml(
      { xmlDir: "/xml", projectDir, allowWrite: true },
      { importConfigurationFromXml },
    )

    expect(result).toEqual({
      ok: false,
      code: "core_error",
      message: "Неизвестный корень Configuration.xml",
      details: {
        succeeded: 0,
        failed: [
          {
            kind: "xml_import_operation_failed",
            name: "",
            message: "Неизвестный корень Configuration.xml",
          },
        ],
        warnings: [],
      },
    })
  })

  it("forwards target and snapshot conflicts from core without cleanup", async () => {
    const projectDir = createProject()
    const componentDir = join(projectDir, "cfe", "Расширение")
    mkdirSync(componentDir, { recursive: true })
    const configurationPath = join(componentDir, "Configuration.yaml")
    writeFileSync(configurationPath, "name: Test\n")
    const snapshotPath = join(projectDir, ".nkdk", "components", "cfe", "Расширение", "configuration-index.bin")
    mkdirSync(join(projectDir, ".nkdk", "components", "cfe", "Расширение"), { recursive: true })
    writeFileSync(snapshotPath, "snapshot")
    const importConfigurationFromXml = vi.fn().mockResolvedValue({
      componentPath: "cfe/Расширение",
      succeeded: 0,
      failed: [
        {
          severity: "error",
          code: "xml_import_operation_failed",
          message: "Целевой каталог компонента не пуст: cfe/Расширение",
          targetProjectPath: "",
        },
        {
          severity: "error",
          code: "xml_import_operation_failed",
          message: "Снимок компонента уже существует: cfe/Расширение",
          targetProjectPath: "",
        },
      ],
      warnings: [],
    })

    const result = await importFromXml(
      { xmlDir: "/xml", projectDir, allowWrite: true },
      { importConfigurationFromXml },
    )

    expect(result).toEqual({
      ok: true,
      componentPath: "cfe/Расширение",
      succeeded: 0,
      failed: [
        {
          kind: "xml_import_operation_failed",
          name: "",
          message: "Целевой каталог компонента не пуст: cfe/Расширение",
        },
        {
          kind: "xml_import_operation_failed",
          name: "",
          message: "Снимок компонента уже существует: cfe/Расширение",
        },
      ],
      warnings: [],
    })
    expect(importConfigurationFromXml).toHaveBeenCalledOnce()
    expect(existsSync(configurationPath)).toBe(true)
    expect(existsSync(snapshotPath)).toBe(true)
  })

  it("preserves an explicit component path as a core constraint", async () => {
    const projectDir = createProject()
    const importConfigurationFromXml = vi.fn().mockResolvedValue({
      componentPath: "cf",
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
      configurationIndexPath: "/yaml/.nkdk/components/cf/configuration-index.bin",
    })

    const result = await importFromXml(
      { xmlDir: "/xml", projectDir, componentPath: "cf", allowWrite: true },
      { importConfigurationFromXml },
    )

    expect(importConfigurationFromXml).toHaveBeenCalledWith({
      context: {
        defaultLanguage: "ru",
        version: "2.20",
        exportToYAML: { toTyped: false },
        fromXML: { forReference: false },
      },
      inputDir: "/xml",
      projectDir,
      requestedComponentPath: "cf",
    })
    expect(result).toEqual({
      ok: true,
      componentPath: "cf",
      succeeded: 1,
      failed: [],
      warnings: [
        {
          code: "unresolved_data_path",
          message: "path",
          targetProjectPath: "Форма.yaml",
        },
      ],
      configurationIndexPath: "/yaml/.nkdk/components/cf/configuration-index.bin",
    })
  })

  function createProject(): string {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-mcp-import-"))
    tempDirs.push(projectDir)
    mkdirSync(join(projectDir, "cf"), { recursive: true })
    return projectDir
  }
})
