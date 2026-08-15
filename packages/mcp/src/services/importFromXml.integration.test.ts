import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { afterEach, describe, expect, it, vi } from "vitest"
import { importFromXml } from "./importFromXml"
import { createCoreProjectStateTestDouble } from "./projectStateTestSupport"
import { jsonToolResult } from "../contracts/common"
import type { DiagnosticReportFileSystem } from "./diagnosticReport"
import { cleanupTempDirs } from "./testTempDirs"

const importContext = {
  languages: { default: "ru", registered: ["ru"], registeredSet: new Set(["ru"]), version: '["ru",["ru"]]' },
  version: "2.20" as const,
  exportToYAML: { toTyped: false as const },
  fromXML: { forReference: false as const },
}

describe("importFromXml service", () => {
  const tempDirs: string[] = []

  afterEach(() => {
    cleanupTempDirs(tempDirs)
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

  it("does not report cf as the target when confirmation uses component auto-detection", async () => {
    const importConfigurationFromXml = vi.fn()

    const result = await importFromXml(
      { xmlDir: "/xml", projectDir: "/missing/project" },
      { importConfigurationFromXml },
    )

    expect(result).toEqual({
      ok: false,
      code: "confirmation_required",
      message: "import_from_xml пишет YAML-файлы; повторите вызов с allowWrite=true",
      details: { xmlDir: "/xml", projectDir: "/missing/project" },
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
    const projectState = createCoreProjectStateTestDouble()

    const result = await importFromXml(
      { xmlDir: "/xml", projectDir, allowWrite: true },
      { importConfigurationFromXml, projectState },
    )

    expect(importConfigurationFromXml).toHaveBeenCalledWith({
      context: importContext,
      inputDir: "/xml",
      projectDir,
      projectState,
    })
    expect(existsSync(componentDir)).toBe(false)
    expect(result).toEqual({
      ok: true,
      componentPath: "cfe/Расширение",
      succeeded: 1,
      diagnostics: [
        {
          severity: "error",
          code: "xml_import_assignment_failed",
          targetProjectPath: "Перечисление/Виды/Свойства.yaml",
          message: "broken xml",
        },
      ],
      summary: { errors: 1, warnings: 0, shown: 1, omitted: 0 },
      truncated: false,
      failed: [
        {
          severity: "error",
          code: "xml_import_assignment_failed",
          targetProjectPath: "Перечисление/Виды/Свойства.yaml",
          message: "broken xml",
        },
      ],
      warnings: [],
    })
  })

  it("returns core diagnostics as an error when component path was not detected", async () => {
    const projectDir = createProject()
    const projectState = createCoreProjectStateTestDouble()
    const importConfigurationFromXml = vi.fn().mockResolvedValue({
      succeeded: 0,
      failed: [
        importFailure("Неизвестный корень Configuration.xml"),
      ],
      warnings: [],
    })

    const result = await importFromXml(
      { xmlDir: "/xml", projectDir, allowWrite: true },
      { importConfigurationFromXml, projectState },
    )

    expect(result).toEqual({
      ok: false,
      code: "core_error",
      message: "Неизвестный корень Configuration.xml",
      details: {
        succeeded: 0,
        diagnostics: [
          {
            severity: "error",
            code: "xml_import_operation_failed",
            message: "Неизвестный корень Configuration.xml",
          },
        ],
        summary: { errors: 1, warnings: 0, shown: 1, omitted: 0 },
        truncated: false,
        failed: [
          {
            severity: "error",
            code: "xml_import_operation_failed",
            message: "Неизвестный корень Configuration.xml",
          },
        ],
        warnings: [],
      },
    })
  })

  it("forwards target and snapshot conflicts from core without cleanup", async () => {
    const projectDir = createProject()
    const projectState = createCoreProjectStateTestDouble()
    const componentDir = join(projectDir, "cfe", "Расширение")
    mkdirSync(componentDir, { recursive: true })
    const configurationPath = join(componentDir, "Configuration.yaml")
    writeFileSync(configurationPath, "name: Test\n")
    const snapshotPath = join(projectDir, ".nkdk", "components", "cfe", "Расширение", "configuration-index.lmdb")
    mkdirSync(join(projectDir, ".nkdk", "components", "cfe", "Расширение"), { recursive: true })
    writeFileSync(snapshotPath, "snapshot")
    const importConfigurationFromXml = vi.fn().mockResolvedValue({
      componentPath: "cfe/Расширение",
      succeeded: 0,
      failed: [
        importFailure("Целевой каталог компонента не пуст: cfe/Расширение"),
        importFailure("Снимок компонента уже существует: cfe/Расширение"),
      ],
      warnings: [],
    })

    const result = await importFromXml(
      { xmlDir: "/xml", projectDir, allowWrite: true },
      { importConfigurationFromXml, projectState },
    )

    expect(result).toEqual({
      ok: true,
      componentPath: "cfe/Расширение",
      succeeded: 0,
      diagnostics: [
        {
          severity: "error",
          code: "xml_import_operation_failed",
          message: "Целевой каталог компонента не пуст: cfe/Расширение",
        },
        {
          severity: "error",
          code: "xml_import_operation_failed",
          message: "Снимок компонента уже существует: cfe/Расширение",
        },
      ],
      summary: { errors: 2, warnings: 0, shown: 2, omitted: 0 },
      truncated: false,
      failed: [
        {
          severity: "error",
          code: "xml_import_operation_failed",
          message: "Целевой каталог компонента не пуст: cfe/Расширение",
        },
        {
          severity: "error",
          code: "xml_import_operation_failed",
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
    const projectState = createCoreProjectStateTestDouble()
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
      configurationIndexPath: "/yaml/.nkdk/components/cf/configuration-index.lmdb",
    })

    const result = await importFromXml(
      { xmlDir: "/xml", projectDir, componentPath: "cf", allowWrite: true },
      { importConfigurationFromXml, projectState },
    )

    expect(importConfigurationFromXml).toHaveBeenCalledWith({
      context: importContext,
      inputDir: "/xml",
      projectDir,
      projectState,
      requestedComponentPath: "cf",
    })
    expect(result).toEqual({
      ok: true,
      componentPath: "cf",
      succeeded: 1,
      diagnostics: [
        {
          severity: "warning",
          code: "unresolved_data_path",
          message: "path",
          targetProjectPath: "Форма.yaml",
        },
      ],
      summary: { errors: 0, warnings: 1, shown: 1, omitted: 0 },
      truncated: false,
      failed: [],
      warnings: [
        {
          code: "unresolved_data_path",
          message: "path",
          targetProjectPath: "Форма.yaml",
        },
      ],
      configurationIndexPath: "/yaml/.nkdk/components/cf/configuration-index.lmdb",
    })
  })

  it("передаёт concurrency в XML-import ядра", async () => {
    const projectDir = createProject()
    const projectState = createCoreProjectStateTestDouble()
    const importConfigurationFromXml = vi.fn().mockResolvedValue({
      componentPath: "cf",
      succeeded: 1,
      failed: [],
      warnings: [],
    })

    await importFromXml(
      { xmlDir: "/xml", projectDir, componentPath: "cf", concurrency: 1, allowWrite: true },
      { importConfigurationFromXml, projectState },
    )

    expect(importConfigurationFromXml).toHaveBeenCalledWith({
      context: importContext,
      inputDir: "/xml",
      projectDir,
      projectState,
      requestedComponentPath: "cf",
      concurrency: 1,
    })
  })

  it("ограничивает ответ с 200 ошибками и пишет полный отчёт", async () => {
    const projectDir = createProject()
    const report = countingReportFileSystem()
    const importConfigurationFromXml = vi.fn().mockResolvedValue({
      componentPath: "cf",
      succeeded: 0,
      failed: Array.from({ length: 200 }, (_unused, index) => ({
        severity: "error" as const,
        code: "xml_import_assignment_failed",
        message: `Ошибка ${index}`,
        targetProjectPath: `Справочник/${index}/Свойства.yaml`,
      })),
      warnings: [],
    })

    const result = await importFromXml(
      { xmlDir: "/xml", projectDir, allowWrite: true },
      {
        importConfigurationFromXml,
        projectState: createCoreProjectStateTestDouble(),
        diagnosticReportFileSystem: report.fileSystem,
      },
    )
    const messageBytes = Buffer.byteLength(JSON.stringify(jsonToolResult(result)))

    expect(result).toMatchObject({
      ok: true,
      summary: { errors: 200, warnings: 0, shown: 100, omitted: 100 },
      truncated: true,
      report: { format: "application/x-ndjson" },
    })
    expect(result.ok && result.diagnostics).toHaveLength(100)
    expect(result.ok && result.failed).toHaveLength(100)
    expect(report.lines()).toBe(200)
    expect(messageBytes).toBeLessThan(1024 * 1024)
  })

  function createProject(): string {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-mcp-import-"))
    tempDirs.push(projectDir)
    mkdirSync(join(projectDir, "cf"), { recursive: true })
    return projectDir
  }
})

function countingReportFileSystem(): {
  readonly fileSystem: DiagnosticReportFileSystem
  readonly lines: () => number
} {
  let lines = 0
  return {
    lines: () => lines,
    fileSystem: {
      async mkdir() {},
      async open() {
        return {
          async write(chunk) { lines += chunk.match(/\n/g)?.length ?? 0 },
          async close() {},
        }
      },
      async rename() {},
      async readdir() { return [] },
      async unlink() {},
    },
  }
}

function importFailure(message: string) {
  return {
    severity: "error" as const,
    code: "xml_import_operation_failed",
    message,
    targetProjectPath: "",
  }
}
