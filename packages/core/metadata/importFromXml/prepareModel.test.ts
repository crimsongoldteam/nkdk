import fs from "node:fs"
import os from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it, vi } from "vitest"
import { mockContextFromXML } from "../../tests/mockContext"
import { createConfigurationIndexCollector } from "../configurationIndex/collector/writer"
import { prepareImportModel } from "./prepareModel"
import type { ImportAssignment } from "./types"

const configurationFixturesDir = join(import.meta.dirname, "../appliedObjects/configuration/__fixtures__")
const syncXmlDir = join(configurationFixturesDir, "syncConfiguration/xml")

afterEach(() => {
  vi.restoreAllMocks()
})

describe("prepareImportModel", () => {
  it("prepares an applied object without writing YAML or external files", async () => {
    const writeFile = vi.spyOn(fs.promises, "writeFile")
    const assignment = catalogAssignment()

    const prepared = await prepareImportModel({
      assignment,
      context: mockContextFromXML(),
      collector: createConfigurationIndexCollector(),
    })

    expect(prepared.assignment).toBe(assignment)
    expect(prepared.targetProjectPath).toBe("Справочник/Контрагенты/Свойства.yaml")
    expect(prepared.model).toMatchObject({ itemType: "MetadataCatalog", name: "Контрагенты" })
    expect(prepared.generatedFiles).toEqual([])
    expect(writeFile).not.toHaveBeenCalled()
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

    const prepared = await prepareImportModel({
      assignment,
      context: mockContextFromXML(),
      collector: createConfigurationIndexCollector(),
    })

    expect(prepared.targetProjectPath).toBe("Конфигурация.yaml")
    expect(prepared.model).toMatchObject({ itemType: "MetadataConfiguration" })
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

    const prepared = await prepareImportModel({
      assignment,
      context: mockContextFromXML(),
      collector: createConfigurationIndexCollector(),
    })

    expect(prepared.model).toMatchObject({ itemType: "ClientApplicationForm" })
    expect(prepared.localDataPathIndex).toBeDefined()
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

      const prepared = await prepareImportModel({
        assignment,
        context: mockContextFromXML(),
        collector: createConfigurationIndexCollector(),
      })

      expect(prepared.model).toMatchObject({
        itemType: "ClientApplicationForm",
        name: "ОбычнаяФорма",
        formType: "Ordinary",
      })
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
        prepareImportModel({
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
