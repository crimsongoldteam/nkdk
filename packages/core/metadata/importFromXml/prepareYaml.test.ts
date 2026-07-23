import fs from "node:fs"
import os from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it, vi } from "vitest"
import { mockContextFromXML } from "../../tests/mockContext"
import { createConfigurationIndexCollector } from "../configurationIndex/collector/writer"
import { createOperationProfiler } from "../validation/profile"
import { parseMetadataYamlData } from "../../yaml/parseMetadataYaml"
import { discoverXmlImport } from "./discovery"
import {
  prepareImportYaml,
  registeredImportRuleLookupCountForTests,
  resetRegisteredImportRuleLookupCountForTests,
} from "./prepareYaml"
import { describeRegisteredXmlImportRoutes } from "./routes"
import type { ImportAssignment } from "./types"

const configurationFixturesDir = join(import.meta.dirname, "../appliedObjects/configuration/__fixtures__")
const syncXmlDir = join(configurationFixturesDir, "syncConfiguration/xml")
const catalogSyncFixtureDir = join(import.meta.dirname, "../appliedObjects/metadataCatalog/__fixtures__/sync/xml")
const subsystemFixturePath = join(import.meta.dirname, "../appliedObjects/metadataSubsystem/__fixtures__/full.xml")

afterEach(() => {
  vi.restoreAllMocks()
})

describe("prepareImportYaml", () => {
  it("imports a common form through the standard nested rules converter", async () => {
    const fixtureDir = join(import.meta.dirname, "../appliedObjects/metadataCommonForm/__fixtures__/sync")
    const profiler = createOperationProfiler({
      operation: "import-from-xml",
      scope: { scope: "worker", workerIndex: 0 },
      aggregate: true,
    })
    const prepared = await prepareImportYaml({
      assignment: {
        id: "common-form",
        role: "properties",
        targetProjectPath: "ОбщаяФорма/КонстантаВсеСвойства/Свойства.yaml",
        itemType: "MetadataCommonForm",
        itemName: "КонстантаВсеСвойства",
        logicalAddress: "ОбщаяФорма.КонстантаВсеСвойства",
        owner: undefined,
        xmlFiles: [
          { role: "metadata", sourcePath: join(fixtureDir, "xml/КонстантаВсеСвойства.xml") },
          { role: "property", sourcePath: join(fixtureDir, "xml/КонстантаВсеСвойства/Ext/Form.xml") },
        ],
        externalFiles: [],
      },
      context: mockContextFromXML(),
      collector: createConfigurationIndexCollector(),
      profiler,
    })
    const expected = parseMetadataYamlData(
      fs.readFileSync(join(fixtureDir, "yaml/КонстантаВсеСвойства/Свойства.yaml"), "utf8")
    )

    expect(expected.syntaxErrors).toEqual([])
    expect(prepared.yaml).toEqual(expected.data)
    expect(profiler.records().map(({ substep }) => substep)).not.toContain(
      "XML в YAML: атомарный тип ClientApplicationForm"
    )
    const substeps = profiler.records().map(({ substep }) => substep)
    expect(substeps).toContain("XML в YAML: подготовка плана импорта")
    expect(substeps).toContain("XML в YAML: обход XML")
    expect(substeps).not.toContain("XML в YAML: определение порядка свойств")
    expect(substeps).not.toContain("XML в YAML: выбор свойств")
  })

  it("prepares an applied object without writing YAML or external files", async () => {
    const writeFile = vi.spyOn(fs.promises, "writeFile")
    const assignment = catalogAssignment()
    const collector = createConfigurationIndexCollector()

    const prepared = await prepareImportYaml({
      assignment,
      context: mockContextFromXML(),
      collector,
    })

    expect(prepared.assignment).toBe(assignment)
    expect(prepared.targetProjectPath).toBe("Справочник/Контрагенты/Свойства.yaml")
    expect(prepared.yaml).toMatchObject({ Синоним: "Контрагенты справочник" })
    expect(prepared.localIndexes).toEqual(expect.any(Object))
    expect(prepared).not.toHaveProperty("model")
    expect(prepared).not.toHaveProperty("xml")
    expect(prepared.generatedFiles).toEqual([])
    expect(JSON.stringify(prepared.yaml)).not.toContain("ФормаЭлемента")
    expect(collector.fragment(assignment.targetProjectPath).identities).toContainEqual({
      logicalAddress: "Справочник.Контрагенты",
      kind: "uuid",
      value: "0f4c2a9b-1d3e-4b6f-8a7c-9e1d2c3b4a5f",
    })
    expect(writeFile).not.toHaveBeenCalled()
  })

  it.each([
    [
      "DocumentNumerator",
      "MetadataDocumentNumerator",
      "НумераторПоУмолчанию",
      "Документ/Нумераторы/НумераторПоУмолчанию/Свойства.yaml",
      "../appliedObjects/metadataDocumentNumerator/__fixtures__/minimal.xml",
    ],
    [
      "Document",
      "MetadataDocument",
      "ДокументПоУмолчанию",
      "Документ/ДокументПоУмолчанию/Свойства.yaml",
      "../appliedObjects/metadataDocument/__fixtures__/minimal.xml",
    ],
    [
      "Sequence",
      "MetadataSequence",
      "ПоследовательностьПоУмолчанию",
      "Последовательность/ПоследовательностьПоУмолчанию/Свойства.yaml",
      "../appliedObjects/metadataSequence/__fixtures__/minimal.xml",
    ],
  ])("prepares %s through the direct XML to YAML traversal", async (_label, itemType, itemName, target, fixture) => {
    const prepared = await prepareImportYaml({
      assignment: {
        id: itemName,
        role: "properties",
        targetProjectPath: target,
        itemType,
        itemName,
        logicalAddress: `${itemType}.${itemName}`,
        owner: undefined,
        xmlFiles: [{ role: "metadata", sourcePath: join(import.meta.dirname, fixture) }],
        externalFiles: [],
      },
      context: mockContextFromXML(),
      collector: createConfigurationIndexCollector(),
    })

    expect(prepared.yaml).toEqual(expect.any(Object))
    expect(prepared).not.toHaveProperty("model")
  })

  it("creates the child logical address before importing child properties", async () => {
    const inputDir = fs.mkdtempSync(join(os.tmpdir(), "nkdk-import-child-address-"))
    try {
      const metadataPath = join(inputDir, "ТестСправочник.xml")
      fs.writeFileSync(
        metadataPath,
        `<?xml version="1.0" encoding="UTF-8"?>
<MetaDataObject xmlns="http://v8.1c.ru/8.3/MDClasses">
  <Catalog uuid="00000000-0000-0000-0000-000000000001">
    <Properties><Name>ТестСправочник</Name></Properties>
    <ChildObjects><Command uuid="00000000-0000-0000-0000-000000000002"><Properties><Name>Обновить</Name></Properties></Command></ChildObjects>
  </Catalog>
</MetaDataObject>`
      )
      const collector = createConfigurationIndexCollector()
      const targetProjectPath = "Справочник/ТестСправочник/Свойства.yaml"
      await prepareImportYaml({
        assignment: {
          id: "catalog-with-command",
          role: "properties",
          targetProjectPath,
          itemType: "MetadataCatalog",
          itemName: "ТестСправочник",
          logicalAddress: "Справочник.ТестСправочник",
          owner: undefined,
          xmlFiles: [{ role: "metadata", sourcePath: metadataPath }],
          externalFiles: [],
        },
        context: mockContextFromXML(),
        collector,
      })

      expect(collector.fragment(targetProjectPath).identities).toContainEqual({
        logicalAddress: "Справочник.ТестСправочник.Команда.Обновить",
        kind: "uuid",
        value: "00000000-0000-0000-0000-000000000002",
      })
    } finally {
      fs.rmSync(inputDir, { recursive: true, force: true })
    }
  })

  it("preserves xsi:nil service data while reading applied XML", async () => {
    const inputDir = fs.mkdtempSync(join(os.tmpdir(), "nkdk-import-xsi-nil-"))
    try {
      const sourceFixture = join(
        import.meta.dirname,
        "../appliedObjects/metadataCommonAttribute/__fixtures__/minimal.xml"
      )
      const metadataPath = join(inputDir, "ОбщийРеквизит.xml")
      fs.writeFileSync(
        metadataPath,
        fs
          .readFileSync(sourceFixture, "utf8")
          .replace('<FillValue xsi:type="xs:string"/>', '<FillValue xsi:nil="true"/>')
      )
      const collector = createConfigurationIndexCollector()
      const targetProjectPath = "ОбщийРеквизит/ОбщийРеквизитПоУмолчанию/Свойства.yaml"
      await prepareImportYaml({
        assignment: {
          id: "common-attribute-nil",
          role: "properties",
          targetProjectPath,
          itemType: "MetadataCommonAttribute",
          itemName: "ОбщийРеквизитПоУмолчанию",
          logicalAddress: "ОбщийРеквизит.ОбщийРеквизитПоУмолчанию",
          owner: undefined,
          xmlFiles: [{ role: "metadata", sourcePath: metadataPath }],
          externalFiles: [],
        },
        context: mockContextFromXML(),
        collector,
      })

      expect(collector.fragment(targetProjectPath).xmlValues).toContainEqual({
        logicalAddress: "ОбщийРеквизит.ОбщийРеквизитПоУмолчанию.fillValue",
        xsiNil: true,
      })
    } finally {
      fs.rmSync(inputDir, { recursive: true, force: true })
    }
  })

  it("prepares a nested file item through its registered metadata rule", async () => {
    const assignment: ImportAssignment = {
      id: "nested-subsystem",
      role: "fileItem",
      targetProjectPath: "Подсистема/Родитель/Подсистемы/Дочерняя/Свойства.yaml",
      itemType: "MetadataSubsystem",
      itemName: "ПодсистемаПолная",
      logicalAddress: "Подсистема.Родитель.MetadataSubsystem.ПодсистемаПолная",
      owner: {
        itemType: "MetadataSubsystem",
        name: "Родитель",
        logicalAddress: "Подсистема.Родитель",
      },
      xmlFiles: [{ role: "metadata", sourcePath: subsystemFixturePath }],
      externalFiles: [],
    }

    const prepared = await prepareImportYaml({
      assignment,
      context: mockContextFromXML(),
      collector: createConfigurationIndexCollector(),
    })

    expect(prepared.rule.itemType).toBe("MetadataSubsystem")
    expect(prepared.yaml).toEqual(expect.any(Object))
    expect(prepared.localIndexes.metadata.formDataPathIndex).toBeUndefined()
  })

  it("reuses registered import rules between assignments of the same item type", async () => {
    resetRegisteredImportRuleLookupCountForTests()
    const assignment = catalogAssignment()

    await prepareImportYaml({
      assignment,
      context: mockContextFromXML(),
      collector: createConfigurationIndexCollector(),
    })
    await prepareImportYaml({
      assignment: { ...assignment, id: "catalog-copy" },
      context: mockContextFromXML(),
      collector: createConfigurationIndexCollector(),
    })

    expect(registeredImportRuleLookupCountForTests()).toBe(1)
  })

  it("discovers a fixture child template as an owner external file and prepares only the owner model", async () => {
    const inputDir = fs.mkdtempSync(join(os.tmpdir(), "nkdk-import-child-template-"))
    const ownerName = "СправочникCоВсемиОбъектами"
    const ownerRoot = join(inputDir, "Catalogs", ownerName)
    try {
      fs.mkdirSync(join(ownerRoot, "Templates", "Макет", "Ext"), { recursive: true })
      fs.copyFileSync(join(catalogSyncFixtureDir, `${ownerName}.xml`), `${ownerRoot}.xml`)
      fs.copyFileSync(join(catalogSyncFixtureDir, "Templates", "Макет.xml"), join(ownerRoot, "Templates", "Макет.xml"))
      fs.copyFileSync(
        join(catalogSyncFixtureDir, "Templates", "Макет", "Ext", "Template.txt"),
        join(ownerRoot, "Templates", "Макет", "Ext", "Template.txt")
      )

      const discovered = await discoverXmlImport({
        xmlDir: inputDir,
        routes: describeRegisteredXmlImportRoutes(),
      })
      const prepared = await Promise.all(
        discovered.assignments.map((assignment) =>
          prepareImportYaml({
            assignment,
            context: mockContextFromXML(),
            collector: createConfigurationIndexCollector(),
          })
        )
      )

      expect(prepared).toHaveLength(1)
      expect(prepared[0]?.yaml).toEqual(expect.any(Object))
      expect(prepared[0]?.assignment.externalFiles).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            sourcePath: join(ownerRoot, "Templates", "Макет.xml"),
            targetProjectPath: `Справочник/${ownerName}/Шаблоны/Макет/Template.xml`,
          }),
        ])
      )
    } finally {
      fs.rmSync(inputDir, { recursive: true, force: true })
    }
  })

  it("prepares Конфигурация.yaml without writing files", async () => {
    const writeFile = vi.spyOn(fs.promises, "writeFile")
    const assignment: ImportAssignment = {
      id: "configuration",
      role: "configuration",
      targetProjectPath: "Конфигурация.yaml",
      itemType: "MetadataConfiguration",
      itemName: "Конфигурация",
      logicalAddress: "Конфигурация",
      owner: undefined,
      xmlFiles: [{ role: "metadata", sourcePath: join(configurationFixturesDir, "full.xml") }],
      externalFiles: [],
    }

    const prepared = await prepareImportYaml({
      assignment,
      context: mockContextFromXML(),
      collector: createConfigurationIndexCollector(),
    })

    expect(prepared.targetProjectPath).toBe("Конфигурация.yaml")
    expect(prepared.yaml).toEqual(expect.any(Object))
    expect(prepared).not.toHaveProperty("model")
    expect(prepared.generatedFiles).toEqual([])
    expect(writeFile).not.toHaveBeenCalled()
  })

  it("reads both form XML inputs without loading the owner model or writing files", async () => {
    const writeFile = vi.spyOn(fs.promises, "writeFile")
    const readFile = vi.spyOn(fs.promises, "readFile")
    const formRoot = join(syncXmlDir, "Catalogs/Контрагенты/Forms/ФормаЭлемента")
    const metadataPath = `${formRoot}.xml`
    const bodyPath = join(formRoot, "Ext/Form.xml")
    const ownerPath = join(syncXmlDir, "Catalogs/Контрагенты.xml")
    const assignment: ImportAssignment = {
      id: "catalog-form",
      role: "fileItem",
      targetProjectPath: "Справочник/Контрагенты/Формы/ФормаЭлемента/Форма.yaml",
      itemType: "ClientApplicationForm",
      itemName: "ФормаЭлемента",
      logicalAddress: "Справочник.Контрагенты.Форма.ФормаЭлемента",
      owner: {
        itemType: "MetadataCatalog",
        name: "Контрагенты",
        logicalAddress: "Справочник.Контрагенты",
      },
      xmlFiles: [
        { role: "metadata", sourcePath: metadataPath },
        { role: "body", sourcePath: bodyPath },
      ],
      externalFiles: [],
    }

    const prepared = await prepareImportYaml({
      assignment,
      context: mockContextFromXML(),
      collector: createConfigurationIndexCollector(),
    })

    expect(prepared.yaml).toEqual(expect.any(Object))
    expect(prepared.localIndexes.metadata.formDataPathIndex).toBeDefined()
    expect(prepared).not.toHaveProperty("model")
    expect(prepared).not.toHaveProperty("xml")
    expect(readFile).toHaveBeenCalledTimes(2)
    expect(readFile).toHaveBeenCalledWith(metadataPath, "utf-8")
    expect(readFile).toHaveBeenCalledWith(bodyPath, "utf-8")
    expect(readFile).not.toHaveBeenCalledWith(ownerPath, expect.anything())
    expect(writeFile).not.toHaveBeenCalled()
  })

  it("prepares an ordinary form whose assignment has no body XML", async () => {
    const inputDir = fs.mkdtempSync(join(os.tmpdir(), "nkdk-import-ordinary-form-"))
    try {
      const metadataPath = join(inputDir, "ОбычнаяФорма.xml")
      fs.writeFileSync(
        metadataPath,
        `<?xml version="1.0" encoding="UTF-8"?>
<MetaDataObject xmlns="http://v8.1c.ru/8.3/MDClasses" version="2.20">
  <Form uuid="aaaaaaaa-1111-2222-3333-bbbbbbbbbbbb">
    <Properties><Name>ОбычнаяФорма</Name><FormType>Ordinary</FormType></Properties>
  </Form>
</MetaDataObject>`
      )
      const assignment: ImportAssignment = {
        id: "ordinary-form",
        role: "fileItem",
        targetProjectPath: "Справочник/Контрагенты/Формы/ОбычнаяФорма/Форма.yaml",
        itemType: "ClientApplicationForm",
        itemName: "ОбычнаяФорма",
        logicalAddress: "Справочник.Контрагенты.Форма.ОбычнаяФорма",
        owner: {
          itemType: "MetadataCatalog",
          name: "Контрагенты",
          logicalAddress: "Справочник.Контрагенты",
        },
        xmlFiles: [{ role: "metadata", sourcePath: metadataPath }],
        externalFiles: [],
      }

      const prepared = await prepareImportYaml({
        assignment,
        context: mockContextFromXML(),
        collector: createConfigurationIndexCollector(),
      })

      expect(prepared.yaml).toEqual({})
      expect(prepared).not.toHaveProperty("model")
    } finally {
      fs.rmSync(inputDir, { recursive: true, force: true })
    }
  })

  it("rejects a managed form whose assignment has no body XML", async () => {
    const inputDir = fs.mkdtempSync(join(os.tmpdir(), "nkdk-import-managed-form-"))
    try {
      const metadataPath = join(inputDir, "УправляемаяФорма.xml")
      fs.writeFileSync(
        metadataPath,
        `<?xml version="1.0" encoding="UTF-8"?>
<MetaDataObject xmlns="http://v8.1c.ru/8.3/MDClasses" version="2.20">
  <Form uuid="aaaaaaaa-1111-2222-3333-bbbbbbbbbbbb">
    <Properties><Name>УправляемаяФорма</Name><FormType>Managed</FormType></Properties>
  </Form>
</MetaDataObject>`
      )
      const assignment: ImportAssignment = {
        id: "managed-form",
        role: "fileItem",
        targetProjectPath: "Справочник/Контрагенты/Формы/УправляемаяФорма/Форма.yaml",
        itemType: "ClientApplicationForm",
        itemName: "УправляемаяФорма",
        logicalAddress: "Справочник.Контрагенты.Форма.УправляемаяФорма",
        owner: {
          itemType: "MetadataCatalog",
          name: "Контрагенты",
          logicalAddress: "Справочник.Контрагенты",
        },
        xmlFiles: [{ role: "metadata", sourcePath: metadataPath }],
        externalFiles: [],
      }

      await expect(
        prepareImportYaml({
          assignment,
          context: mockContextFromXML(),
          collector: createConfigurationIndexCollector(),
        })
      ).rejects.toThrow("Form.xml")
    } finally {
      fs.rmSync(inputDir, { recursive: true, force: true })
    }
  })
})

function catalogAssignment(): ImportAssignment {
  return {
    id: "catalog",
    role: "properties",
    targetProjectPath: "Справочник/Контрагенты/Свойства.yaml",
    itemType: "MetadataCatalog",
    itemName: "Контрагенты",
    logicalAddress: "Справочник.Контрагенты",
    owner: undefined,
    xmlFiles: [{ role: "metadata", sourcePath: join(syncXmlDir, "Catalogs/Контрагенты.xml") }],
    externalFiles: [],
  }
}
