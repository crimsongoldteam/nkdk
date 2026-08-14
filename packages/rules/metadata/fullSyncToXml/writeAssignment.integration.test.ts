import fs from "node:fs"
import { mkdtempSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { mockContextToXML } from "../../tests/mockContext"
import { createConfigurationIndexCollector } from "@nkdk/runtime"
import { createYAMLToXMLProfile } from "@nkdk/runtime/rule-kit"
import { prepareYamlFiles } from "../project/prepareYamlFiles"
import { writeFullXmlSyncAssignment } from "./writeAssignment"
import { prepareFullXmlSyncAssignment } from "./prepareAssignment"
import type { FullXmlSyncAssignment } from "./types"
import { fullXmlSyncTestOutput, fullXmlSyncTestTopologyFields } from "./testTopology"
import { testConfigurationIndexReader } from "../../tests/configurationIndex"

describe("writeFullXmlSyncAssignment", () => {
  const tempDirs: string[] = []
  const emptyComposition = { children: () => [] }

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true })
  })

  function tempDir(): string {
    const dir = mkdtempSync(join(tmpdir(), "nkdk-write-assignment-"))
    tempDirs.push(dir)
    return dir
  }

  async function writePreparedAssignmentForTest(
    assignment: FullXmlSyncAssignment,
    preparedYamlFile: Parameters<typeof prepareFullXmlSyncAssignment>[0]["preparedYamlFile"],
    outputDir: string,
  ) {
    const context = mockContextToXML()
    const prepared = prepareFullXmlSyncAssignment({
      assignment,
      preparedYamlFile,
      context,
      index: testConfigurationIndexReader(),
      composition: emptyComposition,
    })
    return writeFullXmlSyncAssignment({
      prepared,
      context,
      outputTarget: { kind: "directory", outputDir },
    })
  }

  async function writeDataProcessorOwnerFromYaml(projectDir: string, yaml: string, removeSource = false) {
    const sourceProjectPath = "Обработка/ОбработкаВсеСвойства/Свойства.yaml"
    const sourcePath = join(projectDir, ...sourceProjectPath.split("/"))
    fs.mkdirSync(join(projectDir, "Обработка", "ОбработкаВсеСвойства"), { recursive: true })
    fs.writeFileSync(sourcePath, yaml)
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
    if (removeSource) fs.rmSync(sourcePath)
    const outputDir = join(projectDir, "xml")
    const assignment = dataProcessorAssignment(projectDir)
    const context = mockContextToXML()
    const preparedAssignment = prepareFullXmlSyncAssignment({
      assignment,
      preparedYamlFile: prepared.yamlFiles[0]!,
      context,
      index: testConfigurationIndexReader(),
      composition: emptyComposition,
    })
    const result = await writeFullXmlSyncAssignment({
      prepared: preparedAssignment,
      context,
      outputTarget: { kind: "directory", outputDir },
    })

    return { assignment, outputDir, result, sourceProjectPath }
  }

  it("writes declared owner output from prepared YAML and returns index fragment", async () => {
    const projectDir = tempDir()
    const { assignment, outputDir, result, sourceProjectPath } = await writeDataProcessorOwnerFromYaml(
      projectDir,
      "Синоним: Синоним\nКомментарий: Комментарий\n",
      true
    )

    expect(result.diagnostics).toEqual([])
    expect(result.writtenFiles).toEqual([
      { assignmentId: assignment.id, targetXmlPath: "DataProcessors/ОбработкаВсеСвойства.xml" },
    ])
    expect(result.fragments[0]).toMatchObject({ targetProjectPath: sourceProjectPath })
    expect(result.fragments[0]?.entities).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          logicalAddress: "Обработка.ОбработкаВсеСвойства",
          uuid: expect.any(String),
        }),
      ])
    )
    expect(result.profile?.rulesPassCount).toBe(1)
    expect(new Set(result.profile?.propertyPaths).size).toBe(result.profile?.propertyPaths.length)
    expect(fs.readFileSync(join(outputDir, "DataProcessors", "ОбработкаВсеСвойства.xml"), "utf-8")).toContain(
      "<Name>ОбработкаВсеСвойства</Name>"
    )
  })

  it("writes owner XML from an empty properties YAML file", async () => {
    const projectDir = tempDir()
    const { outputDir, result } = await writeDataProcessorOwnerFromYaml(projectDir, "")

    expect(result.diagnostics).toEqual([])
    expect(fs.readFileSync(join(outputDir, "DataProcessors", "ОбработкаВсеСвойства.xml"), "utf-8")).toContain(
      "<Name>ОбработкаВсеСвойства</Name>"
    )
  })

  it("writes numerator XML from a flat YAML file", async () => {
    const projectDir = tempDir()
    const sourceProjectPath = "Нумератор/НумераторЗаказов.yaml"
    const sourcePath = join(projectDir, "Нумератор", "НумераторЗаказов.yaml")
    fs.mkdirSync(join(projectDir, "Нумератор"), { recursive: true })
    fs.writeFileSync(sourcePath, "")
    const prepared = prepareYamlFiles({
      files: [{
        projectPath: sourceProjectPath,
        filePath: sourcePath,
        role: "properties",
        owner: { dir: "Нумератор", name: "НумераторЗаказов" },
        itemType: "MetadataDocumentNumerator",
      }],
      itemTypeByYamlDir: { Нумератор: "MetadataDocumentNumerator" },
    })
    const outputDir = join(projectDir, "xml")
    const assignment: FullXmlSyncAssignment = {
      id: sourceProjectPath,
      sourceProjectPath,
      sourcePath,
      expectedContentHash: 0n,
      role: "properties",
      itemType: "MetadataDocumentNumerator",
      itemName: "НумераторЗаказов",
      logicalAddress: "Нумератор.НумераторЗаказов",
      ...fullXmlSyncTestTopologyFields(sourceProjectPath),
    }
    const result = await writePreparedAssignmentForTest(assignment, prepared.yamlFiles[0]!, outputDir)

    expect(result.diagnostics).toEqual([])
    expect(result.writtenFiles).toEqual([
      expect.objectContaining({ targetXmlPath: "DocumentNumerators/НумераторЗаказов.xml" }),
    ])
    expect(fs.readFileSync(
      join(outputDir, "DocumentNumerators", "НумераторЗаказов.xml"),
      "utf-8",
    )).toContain("<Name>НумераторЗаказов</Name>")
  })

  it("rejects an assignment whose topology node is absent", async () => {
    const projectDir = tempDir()
    expect(() => prepareFullXmlSyncAssignment({
      assignment: {
        ...dataProcessorAssignment(projectDir),
        ...fullXmlSyncTestOutput("child.xml"),
      },
      preparedYamlFile: {
        projectPath: "Обработка/ОбработкаВсеСвойства/Свойства.yaml",
        filePath: join(projectDir, "missing.yaml"),
        role: "properties",
        owner: { dir: "Обработка", name: "ОбработкаВсеСвойства" },
        data: {},
        syntaxDiagnostics: [],
      },
      context: mockContextToXML(),
      index: testConfigurationIndexReader(),
      composition: emptyComposition,
    })).toThrow("Не найден узел топологии: test-assignment")
  })

  it("writes form metadata and body XML from prepared YAML", async () => {
    const projectDir = tempDir()
    const sourceProjectPath = "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml"
    const sourcePath = join(projectDir, ...sourceProjectPath.split("/"))
    fs.mkdirSync(join(projectDir, "Справочник", "Товары", "Формы", "ФормаЭлемента"), { recursive: true })
    fs.writeFileSync(
      sourcePath,
      [
        "Реквизиты:",
        "  Объект:",
        "    Тип: Строка",
        "  Список:",
        "    Тип: ДинамическийСписок",
        "    ДинамическийСписок:",
        "      ПроизвольныйЗапрос: Истина",
        "Элементы:",
        "  Поле:",
        "    Вид: ПолеВвода",
        "    ПутьКДанным: Объект",
      ].join("\n")
    )
    const queryPath = join(projectDir, "Справочник", "Товары", "Формы", "ФормаЭлемента", "ДинамическийСписок", "Список.query")
    fs.mkdirSync(join(queryPath, ".."), { recursive: true })
    fs.writeFileSync(queryPath, "ВЫБРАТЬ 1")
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
      expectedContentHash: 0n,
      role: "form",
      itemType: "ClientApplicationForm",
      itemName: "ФормаЭлемента",
      logicalAddress: "Справочник.Товары.Форма.ФормаЭлемента",
      owner: { itemType: "MetadataCatalog", name: "Товары", logicalAddress: "Справочник.Товары" },
      ...fullXmlSyncTestTopologyFields(sourceProjectPath),
    }

    const result = await writePreparedAssignmentForTest(assignment, prepared.yamlFiles[0]!, outputDir)

    expect(result.diagnostics).toEqual([])
    expect(result.writtenFiles.map((file) => file.targetXmlPath)).toEqual([
      "Catalogs/Товары/Forms/ФормаЭлемента.xml",
      "Catalogs/Товары/Forms/ФормаЭлемента/Ext/Form.xml",
    ])
    expect(fs.existsSync(join(outputDir, "Catalogs", "Товары", "Forms", "ФормаЭлемента.xml"))).toBe(true)
    expect(fs.existsSync(join(outputDir, "Catalogs", "Товары", "Forms", "ФормаЭлемента", "Ext", "Form.xml"))).toBe(true)
    expect(fs.readFileSync(
      join(outputDir, "Catalogs", "Товары", "Forms", "ФормаЭлемента", "Ext", "Form.xml"),
      "utf-8",
    )).toContain("<QueryText>ВЫБРАТЬ 1</QueryText>")
    expect(result.writtenFiles.map((file) => file.targetXmlPath)).not.toContain(
      "Catalogs/Товары/Forms/ФормаЭлемента/Ext/ДинамическийСписок/Список.query",
    )
    expect(fs.existsSync(join(
      outputDir,
      "Catalogs",
      "Товары",
      "Forms",
      "ФормаЭлемента",
      "Ext",
      "ДинамическийСписок",
      "Список.query",
    ))).toBe(false)
    expect(fs.existsSync(join(outputDir, "Catalogs", "Товары", "Forms", "ФормаЭлемента", "Ext", "Module.bsl"))).toBe(
      false
    )
    expect(result.profile?.rulesPassCount).toBe(1)
    expect(new Set(result.profile?.propertyPaths).size).toBe(result.profile?.propertyPaths.length)
  })

  it("возвращает отдельные фрагменты рабочей и сохранённой формы", async () => {
    const projectDir = tempDir()
    const assignment = dataProcessorAssignment(projectDir)

    const result = await writeFullXmlSyncAssignment({
      prepared: {
        assignment,
        documents: [],
        indexCollectors: [{
          collector: createConfigurationIndexCollector(),
          targetProjectPath: assignment.sourceProjectPath,
        }, {
          collector: createConfigurationIndexCollector(),
          targetProjectPath: "Обработка/ОбработкаВсеСвойства/БазоваяФорма.yaml",
        }],
        profile: createYAMLToXMLProfile(),
      },
      context: mockContextToXML(),
      outputTarget: { kind: "directory", outputDir: join(projectDir, "xml") },
    })

    expect(result).toMatchObject({
      diagnostics: [],
      fragments: [{
        targetProjectPath: assignment.sourceProjectPath,
        entities: [],
      }, {
        targetProjectPath: "Обработка/ОбработкаВсеСвойства/БазоваяФорма.yaml",
        entities: [],
      }],
    })
  })
})

function dataProcessorAssignment(projectDir: string): FullXmlSyncAssignment {
  return {
    id: "Обработка/ОбработкаВсеСвойства/Свойства.yaml",
    sourceProjectPath: "Обработка/ОбработкаВсеСвойства/Свойства.yaml",
    sourcePath: join(projectDir, "Обработка", "ОбработкаВсеСвойства", "Свойства.yaml"),
    expectedContentHash: 0n,
    role: "properties",
    itemType: "MetadataDataProcessor",
    itemName: "ОбработкаВсеСвойства",
    logicalAddress: "Обработка.ОбработкаВсеСвойства",
    ...fullXmlSyncTestTopologyFields("Обработка/ОбработкаВсеСвойства/Свойства.yaml"),
  }
}
