import fs from "node:fs"
import { mkdtempSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { mockContextToXML } from "../../tests/mockContext"
import { encodeConfigurationIndex } from "../configurationIndex/encode"
import { createConfigurationIndexReader, snapshotConfigurationIndex } from "../configurationIndex/sharedSnapshot"
import { sampleIndex } from "../configurationIndex/testData"
import { prepareYamlFiles } from "../project/prepareYamlFiles"
import { writeFullXmlSyncAssignment } from "./writeAssignment"
import type { FullXmlSyncAssignment } from "./types"

describe("writeFullXmlSyncAssignment", () => {
  const tempDirs: string[] = []

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true })
  })

  function tempDir(): string {
    const dir = mkdtempSync(join(tmpdir(), "nkdk-write-assignment-"))
    tempDirs.push(dir)
    return dir
  }

  it("writes declared owner output from prepared YAML and returns index fragment", async () => {
    const projectDir = tempDir()
    const sourceProjectPath = "Обработка/ОбработкаВсеСвойства/Свойства.yaml"
    const sourcePath = join(projectDir, ...sourceProjectPath.split("/"))
    fs.mkdirSync(join(projectDir, "Обработка", "ОбработкаВсеСвойства"), { recursive: true })
    fs.writeFileSync(sourcePath, "Синоним: Синоним\nКомментарий: Комментарий\n")
    const prepared = prepareYamlFiles({
      files: [
        {
          projectPath: sourceProjectPath,
          filePath: sourcePath,
          role: "properties",
          owner: { dir: "Обработка", name: "ОбработкаВсеСвойства" },
          itemType: "MetadataDataProcessor",
        },
      ],
      itemTypeByYamlDir: { Обработка: "MetadataDataProcessor" },
    })
    fs.rmSync(sourcePath)
    const outputDir = join(projectDir, "xml")
    const assignment = dataProcessorAssignment(projectDir)

    const result = await writeFullXmlSyncAssignment({
      assignment,
      preparedYamlFile: prepared.yamlFiles[0]!,
      context: mockContextToXML(),
      outputDir,
      index: createConfigurationIndexReader(snapshotConfigurationIndex(encodeConfigurationIndex(sampleIndex()))),
    })

    expect(result.diagnostics).toEqual([])
    expect(result.writtenFiles).toEqual([{ assignmentId: assignment.id, targetXmlPath: "DataProcessors/ОбработкаВсеСвойства.xml" }])
    expect(result.fragment).toMatchObject({ targetProjectPath: sourceProjectPath })
    expect(result.fragment?.identities).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          logicalAddress: "Обработка.ОбработкаВсеСвойства",
          kind: "uuid",
        }),
      ])
    )
    expect(fs.readFileSync(join(outputDir, "DataProcessors", "ОбработкаВсеСвойства.xml"), "utf-8")).toContain(
      "<Name>ОбработкаВсеСвойства</Name>"
    )
  })

  it("reports a contract diagnostic when assignment has no owner output", async () => {
    const projectDir = tempDir()
    const result = await writeFullXmlSyncAssignment({
      assignment: { ...dataProcessorAssignment(projectDir), outputs: [{ routeKind: "fileItem", targetXmlPath: "child.xml" }] },
      preparedYamlFile: {
        projectPath: "Обработка/ОбработкаВсеСвойства/Свойства.yaml",
        filePath: join(projectDir, "missing.yaml"),
        role: "properties",
        owner: { dir: "Обработка", name: "ОбработкаВсеСвойства" },
        data: {},
        syntaxDiagnostics: [],
      },
      context: mockContextToXML(),
      outputDir: join(projectDir, "xml"),
      index: createConfigurationIndexReader(snapshotConfigurationIndex(encodeConfigurationIndex(sampleIndex()))),
    })

    expect(result).toMatchObject({
      diagnostics: [expect.objectContaining({ code: "full_xml_sync_no_owner_output" })],
      writtenFiles: [],
    })
    expect(result.fragment).toBeUndefined()
  })

  it("writes form metadata and body XML from prepared YAML", async () => {
    const projectDir = tempDir()
    const sourceProjectPath = "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml"
    const sourcePath = join(projectDir, ...sourceProjectPath.split("/"))
    fs.mkdirSync(join(projectDir, "Справочник", "Товары", "Формы", "ФормаЭлемента"), { recursive: true })
    fs.writeFileSync(
      sourcePath,
      ["Реквизиты:", "  Объект:", "    Тип: Строка", "Элементы:", "  Поле:", "    Вид: ПолеВвода", "    ПутьКДанным: Объект"].join(
        "\n"
      )
    )
    const prepared = prepareYamlFiles({
      files: [
        {
          projectPath: sourceProjectPath,
          filePath: sourcePath,
          role: "form",
          owner: { dir: "Справочник", name: "Товары" },
          itemType: "ClientApplicationForm",
        },
      ],
      itemTypeByYamlDir: { Справочник: "MetadataCatalog" },
    })
    fs.rmSync(sourcePath)
    const outputDir = join(projectDir, "xml")
    const assignment: FullXmlSyncAssignment = {
      id: sourceProjectPath,
      sourceProjectPath,
      sourcePath,
      role: "form",
      itemType: "ClientApplicationForm",
      itemName: "ФормаЭлемента",
      logicalAddress: "Справочник.Товары.Форма.ФормаЭлемента",
      owner: { itemType: "MetadataCatalog", name: "Товары", logicalAddress: "Справочник.Товары" },
      outputs: [{ routeKind: "fileItem", targetXmlPath: "Catalogs/Товары/Forms/ФормаЭлемента.xml" }],
    }

    const result = await writeFullXmlSyncAssignment({
      assignment,
      preparedYamlFile: prepared.yamlFiles[0]!,
      context: mockContextToXML(),
      outputDir,
      index: createConfigurationIndexReader(snapshotConfigurationIndex(encodeConfigurationIndex(sampleIndex()))),
    })

    expect(result.diagnostics).toEqual([])
    expect(result.writtenFiles.map((file) => file.targetXmlPath)).toEqual([
      "Catalogs/Товары/Forms/ФормаЭлемента.xml",
      "Catalogs/Товары/Forms/ФормаЭлемента/Ext/Form.xml",
    ])
    expect(fs.existsSync(join(outputDir, "Catalogs", "Товары", "Forms", "ФормаЭлемента.xml"))).toBe(true)
    expect(fs.existsSync(join(outputDir, "Catalogs", "Товары", "Forms", "ФормаЭлемента", "Ext", "Form.xml"))).toBe(true)
    expect(fs.existsSync(join(outputDir, "Catalogs", "Товары", "Forms", "ФормаЭлемента", "Ext", "Module.bsl"))).toBe(false)
  })
})

function dataProcessorAssignment(projectDir: string): FullXmlSyncAssignment {
  return {
    id: "Обработка/ОбработкаВсеСвойства/Свойства.yaml",
    sourceProjectPath: "Обработка/ОбработкаВсеСвойства/Свойства.yaml",
    sourcePath: join(projectDir, "Обработка", "ОбработкаВсеСвойства", "Свойства.yaml"),
    role: "properties",
    itemType: "MetadataDataProcessor",
    itemName: "ОбработкаВсеСвойства",
    logicalAddress: "Обработка.ОбработкаВсеСвойства",
    outputs: [{ routeKind: "owner", targetXmlPath: "DataProcessors/ОбработкаВсеСвойства.xml" }],
  }
}
