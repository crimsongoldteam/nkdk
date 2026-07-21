import fs from "node:fs"
import os from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it, vi } from "vitest"
import { mockContextFromXML } from "../../tests/mockContext"
import { createConfigurationIndexCollector } from "../configurationIndex/collector/writer"
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

afterEach(() => {
  vi.restoreAllMocks()
})

describe("prepareImportYaml", () => {
  it("prepares an applied object without writing YAML or external files", async () => {
    const writeFile = vi.spyOn(fs.promises, "writeFile")
    const assignment = catalogAssignment()

    const prepared = await prepareImportYaml({
      assignment,
      context: mockContextFromXML(),
      collector: createConfigurationIndexCollector(),
    })

    expect(prepared.assignment).toBe(assignment)
    expect(prepared.targetProjectPath).toBe("Справочник/Контрагенты/Свойства.yaml")
    expect(prepared.yaml).toMatchObject({ ДлинаКода: 9, ДлинаНаименования: 25 })
    expect(prepared.localIndexes).toEqual(expect.any(Object))
    expect(prepared).not.toHaveProperty("model")
    expect(prepared).not.toHaveProperty("xml")
    expect(prepared.generatedFiles).toEqual([])
    expect(writeFile).not.toHaveBeenCalled()
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
