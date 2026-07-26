import fs from "node:fs"
import os from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { afterEach, describe, expect, it } from "vitest"
import { NKDK_CORE_VERSION } from "../../version"
import { mockContextFromXML, mockContextToXML } from "../../tests/mockContext"
import { importContentFromXML } from "../../xml/import/importer"
import {
  readConfigurationIndex,
  writeConfigurationIndexAtomically,
} from "../configurationIndex"
import { importConfigurationFromXml } from "../importFromXml"
import {
  readComponentHashState,
  readComponentIndexes,
  readComponentProjectStructure,
} from "../project/componentState"
import { serializeSharedValidationSnapshot } from "../validation/persistedSharedValidationSnapshot"
import { syncComponentToXml } from "./syncConfiguration"

const extensionFixtureDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../importFromXml/__fixtures__/configurationExtension"
)

describe("configuration extension full XML sync integration", () => {
  const tempDirs: string[] = []

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) {
      fs.rmSync(dir, { recursive: true, force: true })
    }
  })

  it("writes own and adopted metadata with a lazily built BaseForm", async () => {
    const projectDir = fs.mkdtempSync(join(os.tmpdir(), "nkdk-cfe-full-sync-"))
    tempDirs.push(projectDir)
    await writeBaseConfiguration(projectDir)
    const imported = await importConfigurationFromXml({
      context: mockContextFromXML(),
      inputDir: extensionFixtureDir,
      projectDir,
      concurrency: 1,
      operationId: "configuration-extension-full-sync",
    })
    expect(imported.failed).toEqual([])
    writeOwnExtensionCatalog(projectDir)

    const xmlDir = join(projectDir, "xml")
    const result = await syncComponentToXml({
      context: mockContextToXML(),
      projectDir,
      componentPath: "cfe/РасширениеКонтроль",
      xmlDir,
      concurrency: 1,
    })

    expect(result.failed).toEqual([])
    const adopted = parseXml(join(
      xmlDir,
      "Catalogs",
      "СправочникПолный.xml"
    )).MetaDataObject.Catalog
    expect(adopted.Properties.ObjectBelonging).toBe("Adopted")
    expect(adopted.Properties.ExtendedConfigurationObject)
      .toBe("33333333-3333-4333-8333-333333333333")
    const attributes = array(adopted.ChildObjects.Attribute)
    const adoptedAttribute = attributes.find(
      (attribute) => attribute.Properties.Name === "РеквизитСправочника"
    )
    const ownAttribute = attributes.find(
      (attribute) => attribute.Properties.Name === "СобственныйРеквизит"
    )
    expect(adoptedAttribute?.Properties.ExtendedConfigurationObject)
      .toBe("55555555-5555-4555-8555-555555555555")
    expect(ownAttribute?.Properties.ExtendedConfigurationObject).toBeUndefined()

    const own = parseXml(join(
      xmlDir,
      "Catalogs",
      "Собственный.xml"
    )).MetaDataObject.Catalog
    expect(own.Properties.ExtendedConfigurationObject).toBeUndefined()
    expect(own.Properties.ObjectBelonging).not.toBe("Adopted")

    const adoptedForm = parseXml(join(
      xmlDir,
      "Catalogs",
      "СправочникПолный",
      "Forms",
      "ФормаОтчета",
      "Ext",
      "Form.xml"
    )).Form
    expect(adoptedForm.BaseForm).toEqual(
      expect.objectContaining({ _version: "2.20" })
    )
    expect(array(adoptedForm.BaseForm.ChildItems)[0]?.InputField._name)
      .toBe("БазовоеПоле")

    const ownForm = parseXml(join(
      xmlDir,
      "Catalogs",
      "Собственный",
      "Forms",
      "СобственнаяФорма",
      "Ext",
      "Form.xml"
    )).Form
    expect(ownForm.BaseForm).toBeUndefined()
    expect(fs.existsSync(join(xmlDir, "ConfigDumpInfo.xml"))).toBe(false)

    const snapshot = await readConfigurationIndex({
      projectDir,
      address: {
        kind: "configurationExtension",
        name: "РасширениеКонтроль",
      },
    })
    expect(snapshot.binding.componentPath)
      .toBe("cfe/РасширениеКонтроль")
    expect(snapshot.projectFiles.length).toBeGreaterThan(0)
    expect(snapshot.localIndexes.logicalAddresses).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          logicalAddress: "Справочник.СправочникПолный",
        }),
        expect.objectContaining({
          logicalAddress: "Справочник.Собственный",
        }),
      ])
    )
    expect(snapshot.identities.some(({ logicalAddress }) =>
      logicalAddress.includes("БазовоеПоле")
    )).toBe(false)
  }, 30_000)
})

async function writeBaseConfiguration(projectDir: string): Promise<void> {
  write(projectDir, "cf/Конфигурация.yaml", [
    "Имя: БазоваяКонфигурация",
    "ОсновнойЯзык: БазовыйЯзык",
    "",
  ].join("\n"))
  write(projectDir, "cf/Язык/БазовыйЯзык.yaml", "КодЯзыка: ru\n")
  write(
    projectDir,
    "cf/Справочник/СправочникПолный/Свойства.yaml",
    [
      "Реквизиты:",
      "  РеквизитСправочника:",
      "    Тип: Дата",
      "",
    ].join("\n")
  )
  write(
    projectDir,
    "cf/Справочник/СправочникПолный/Формы/ФормаОтчета/Форма.yaml",
    [
      "Реквизиты:",
      "  БазовыйРеквизитФормы:",
      "    Тип: Дата",
      "Элементы:",
      "  БазовоеПоле:",
      "    Вид: ПолеВвода",
      "    Ширина: 99",
      "",
    ].join("\n")
  )

  const structure = await readComponentProjectStructure({
    projectDir,
    address: { kind: "configuration" },
  })
  const hashes = await readComponentHashState({ structure, concurrency: 1 })
  const indexes = await readComponentIndexes({
    structure,
    hashes,
    context: mockContextToXML(),
    concurrency: 1,
  })
  await writeConfigurationIndexAtomically({
    projectDir,
    address: { kind: "configuration" },
    data: {
      binding: {
        indexGeneration: 1n,
        producerVersion: NKDK_CORE_VERSION,
        componentPath: "cf",
        baseFingerprint: new Uint8Array(),
        configurationVersion: new Uint8Array(),
      },
      projectFiles: hashes.projectFiles,
      identities: [
        uuid("Конфигурация", "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"),
        uuid(
          "Справочник.СправочникПолный",
          "33333333-3333-4333-8333-333333333333"
        ),
        uuid(
          "Справочник.СправочникПолный.Реквизит.РеквизитСправочника",
          "55555555-5555-4555-8555-555555555555"
        ),
        uuid(
          "Справочник.СправочникПолный.Форма.ФормаОтчета",
          "88888888-8888-4888-8888-888888888888"
        ),
        uuid(
          "Catalog.СправочникПолный",
          "33333333-3333-4333-8333-333333333333"
        ),
        uuid(
          "Catalog.СправочникПолный.Attribute.РеквизитСправочника",
          "55555555-5555-4555-8555-555555555555"
        ),
        uuid(
          "Catalog.СправочникПолный.Form.ФормаОтчета",
          "88888888-8888-4888-8888-888888888888"
        ),
      ],
      xmlNodes: [],
      xmlValues: [],
      localIndexes: {
        metadata: serializeSharedValidationSnapshot(indexes.metadata),
        dependencies: indexes.dependencies,
        logicalAddresses: indexes.logicalAddresses,
      },
    },
  })
}

function writeOwnExtensionCatalog(projectDir: string): void {
  write(
    projectDir,
    "cfe/РасширениеКонтроль/Справочник/Собственный/Свойства.yaml",
    [
      "Реквизиты:",
      "  СобственныйРеквизит:",
      "    Тип: Строка(20)",
      "",
    ].join("\n")
  )
  write(
    projectDir,
    "cfe/РасширениеКонтроль/Справочник/Собственный/Формы/СобственнаяФорма/Форма.yaml",
    [
      "Элементы:",
      "  СобственноеПоле:",
      "    Вид: ПолеВвода",
      "    Ширина: 10",
      "",
    ].join("\n")
  )
}

function write(projectDir: string, projectPath: string, content: string): void {
  const path = join(projectDir, ...projectPath.split("/"))
  fs.mkdirSync(dirname(path), { recursive: true })
  fs.writeFileSync(path, content)
}

function uuid(logicalAddress: string, value: string) {
  return { logicalAddress, kind: "uuid" as const, value }
}

function parseXml(path: string): any {
  return importContentFromXML(fs.readFileSync(path, "utf8"))
}

function array<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value]
}
