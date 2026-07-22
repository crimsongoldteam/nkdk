import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { createXmlImportWorkerPoolHandle, syncConfigurationFromXML } from "@nkdk/core"
import { importConfiguration } from "./import"

const singleValueEnumerationXML = `<?xml version="1.0" encoding="UTF-8"?>
<MetaDataObject xmlns="http://v8.1c.ru/8.3/MDClasses" xmlns:v8="http://v8.1c.ru/8.1/data/core" xmlns:xr="http://v8.1c.ru/8.3/xcf/readable" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20">
  <Enum uuid="d381585b-33ee-4f3e-9362-ae06f761f29d">
    <Properties>
      <Name>ВидыСервисовЭДО</Name>
      <Synonym>
        <v8:item>
          <v8:lang>ru</v8:lang>
          <v8:content>Виды сервисов ЭДО</v8:content>
        </v8:item>
      </Synonym>
      <Comment/>
      <UseStandardCommands>false</UseStandardCommands>
      <QuickChoice>true</QuickChoice>
      <ChoiceMode>BothWays</ChoiceMode>
      <DefaultListForm/>
      <DefaultChoiceForm/>
      <AuxiliaryListForm/>
      <AuxiliaryChoiceForm/>
      <ListPresentation/>
      <ExtendedListPresentation/>
      <Explanation/>
      <ChoiceHistoryOnInput>Auto</ChoiceHistoryOnInput>
    </Properties>
    <ChildObjects>
      <EnumValue uuid="dcbdca07-2ece-431e-b8bc-536f0df4b67e">
        <Properties>
          <Name>ЭПД</Name>
          <Synonym>
            <v8:item>
              <v8:lang>ru</v8:lang>
              <v8:content>ЭПД</v8:content>
            </v8:item>
          </Synonym>
          <Comment/>
        </Properties>
      </EnumValue>
    </ChildObjects>
  </Enum>
</MetaDataObject>`

describe("import command", () => {
  const xmlImportWorkerPoolHandle = createXmlImportWorkerPoolHandle({ concurrency: 1 })
  const importConfigurationForTest = (xmlDir: string, yamlDir: string) =>
    importConfiguration(xmlDir, yamlDir, {
      syncConfigurationFromXML(params) {
        return syncConfigurationFromXML({ ...params, xmlImportWorkerPoolHandle })
      },
    })

  beforeEach(() => {
    process.exitCode = undefined
  })

  afterAll(async () => {
    await xmlImportWorkerPoolHandle.close()
  })

  afterEach(() => {
    process.exitCode = undefined
    vi.restoreAllMocks()
  })

  it("импортирует перечисление с одним значением через публичный вход CLI", async () => {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-cli-import-"))
    const xmlDir = join(projectDir, "xml")
    const yamlDir = join(projectDir, "yaml")
    mkdirSync(join(xmlDir, "Enums"), { recursive: true })
    writeFileSync(join(xmlDir, "Enums", "ВидыСервисовЭДО.xml"), singleValueEnumerationXML, "utf-8")

    vi.spyOn(process.stdout, "write").mockImplementation(() => true)
    const stderrWrite = vi.spyOn(process.stderr, "write").mockImplementation(() => true)

    try {
      await importConfigurationForTest(xmlDir, yamlDir)

      expect(process.exitCode, JSON.stringify(stderrWrite.mock.calls)).not.toBe(1)
      const yaml = readFileSync(join(yamlDir, "Перечисление", "ВидыСервисовЭДО", "Свойства.yaml"), "utf-8")
      expect(yaml).toContain("Значения:")
      expect(yaml).toContain("  ЭПД:")
    } finally {
      rmSync(projectDir, { recursive: true, force: true })
    }
  }, 15_000)

  it("печатает диагностическую ошибку нового XML-import без падения", async () => {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-cli-import-failure-"))
    const xmlDir = join(projectDir, "xml")
    const yamlDir = join(projectDir, "yaml")
    mkdirSync(join(xmlDir, "Enums"), { recursive: true })
    writeFileSync(join(xmlDir, "Enums", "Сломано.xml"), "<broken>", "utf-8")

    vi.spyOn(process.stdout, "write").mockImplementation(() => true)
    const stderrWrite = vi.spyOn(process.stderr, "write").mockImplementation(() => true)

    try {
      await expect(importConfigurationForTest(xmlDir, yamlDir)).resolves.toBeUndefined()

      expect(process.exitCode).toBe(1)
      expect(stderrWrite).toHaveBeenCalledWith(expect.stringContaining("xml_import_assignment_failed"))
      expect(stderrWrite).not.toHaveBeenCalledWith(expect.stringContaining("Временные файлы:"))
    } finally {
      rmSync(projectDir, { recursive: true, force: true })
    }
  })

  it("печатает предупреждения отдельно от ошибок", async () => {
    const stderrWrite = vi.spyOn(process.stderr, "write").mockImplementation(() => true)
    vi.spyOn(process.stdout, "write").mockImplementation(() => true)
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-cli-import-warning-"))
    const yamlDir = join(projectDir, "yaml")
    const syncConfigurationFromXML = vi.fn().mockResolvedValue({
      succeeded: 0,
      failed: [
        {
          severity: "error" as const,
          code: "xml_import_assignment_failed",
          message: "broken xml",
          targetProjectPath: "Перечисление/Виды/Свойства.yaml",
        },
      ],
      warnings: [
        {
          severity: "warning" as const,
          code: "unresolved_data_path",
          message: "ПутьКДанным не разрешён",
          targetProjectPath: "Форма.yaml",
        },
      ],
    })

    try {
      await importConfiguration("/xml", yamlDir, { syncConfigurationFromXML })
    } finally {
      rmSync(projectDir, { recursive: true, force: true })
    }

    expect(stderrWrite).toHaveBeenCalledWith("⚠ ПутьКДанным не разрешён\n")
    expect(stderrWrite).not.toHaveBeenCalledWith(expect.stringContaining("Временные файлы:"))
    expect(process.exitCode).toBe(1)
  })

  it("не импортирует в непустой YAML-каталог", async () => {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-cli-import-non-empty-"))
    const yamlDir = join(projectDir, "yaml")
    mkdirSync(yamlDir, { recursive: true })
    writeFileSync(join(yamlDir, "Конфигурация.yaml"), "Имя: Тест\n")
    const syncConfigurationFromXML = vi.fn()

    try {
      await expect(importConfiguration("/xml", yamlDir, { syncConfigurationFromXML })).rejects.toThrow(
        "YAML-каталог импорта должен быть пустым"
      )
    } finally {
      rmSync(projectDir, { recursive: true, force: true })
    }
    expect(syncConfigurationFromXML).not.toHaveBeenCalled()
  })
})
