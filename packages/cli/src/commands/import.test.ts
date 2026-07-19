import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { afterEach, describe, expect, it, vi } from "vitest"
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
  const originalExitCode = process.exitCode

  afterEach(() => {
    process.exitCode = originalExitCode
    vi.restoreAllMocks()
  })

  it("импортирует перечисление с одним значением через публичный вход CLI", async () => {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-cli-import-"))
    const xmlDir = join(projectDir, "xml")
    const yamlDir = join(projectDir, "yaml")
    mkdirSync(join(xmlDir, "Enums"), { recursive: true })
    writeFileSync(join(xmlDir, "Enums", "ВидыСервисовЭДО.xml"), singleValueEnumerationXML, "utf-8")

    vi.spyOn(process.stdout, "write").mockImplementation(() => true)
    vi.spyOn(process.stderr, "write").mockImplementation(() => true)

    try {
      await importConfiguration(xmlDir, yamlDir)

      expect(process.exitCode).not.toBe(1)
      const yaml = readFileSync(join(yamlDir, "Перечисление", "ВидыСервисовЭДО", "Свойства.yaml"), "utf-8")
      expect(yaml).toContain("Значения:")
      expect(yaml).toContain("  ЭПД:")
    } finally {
      rmSync(projectDir, { recursive: true, force: true })
    }
  })

  it("печатает диагностическую ошибку нового XML-import без падения", async () => {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-cli-import-failure-"))
    const xmlDir = join(projectDir, "xml")
    const yamlDir = join(projectDir, "yaml")
    mkdirSync(join(xmlDir, "Enums"), { recursive: true })
    writeFileSync(join(xmlDir, "Enums", "Сломано.xml"), "<broken>", "utf-8")

    vi.spyOn(process.stdout, "write").mockImplementation(() => true)
    const stderrWrite = vi.spyOn(process.stderr, "write").mockImplementation(() => true)

    try {
      await expect(importConfiguration(xmlDir, yamlDir)).resolves.toBeUndefined()

      expect(process.exitCode).toBe(1)
      expect(stderrWrite).toHaveBeenCalledWith(expect.stringContaining("xml_import_assignment_failed"))
      expect(stderrWrite).toHaveBeenCalledWith(expect.stringContaining("Временные файлы:"))
    } finally {
      rmSync(projectDir, { recursive: true, force: true })
    }
  })

  it("печатает предупреждения отдельно от ошибок и путь временных файлов", async () => {
    const stderrWrite = vi.spyOn(process.stderr, "write").mockImplementation(() => true)
    vi.spyOn(process.stdout, "write").mockImplementation(() => true)
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
      preservedTempRoot: "/yaml/.nkdk/tmp/import/operation-1",
    })

    await importConfiguration("/xml", "/yaml", { syncConfigurationFromXML })

    expect(stderrWrite).toHaveBeenCalledWith("⚠ ПутьКДанным не разрешён\n")
    expect(stderrWrite).toHaveBeenCalledWith("Временные файлы: /yaml/.nkdk/tmp/import/operation-1\n")
    expect(process.exitCode).toBe(1)
  })
})
