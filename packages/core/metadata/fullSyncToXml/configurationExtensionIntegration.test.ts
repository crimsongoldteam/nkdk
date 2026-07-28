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
import {
  childSegmentUid,
  childUid,
} from "../configurationIndex/logicalAddress"
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
const formProjectPath =
  "Справочник/СправочникПолный/Формы/ФормаОтчета/Форма.yaml"
const formAddress =
  "Справочник.СправочникПолный.Форма.ФормаОтчета"
const baseGroupAddress = childUid(
  formAddress,
  "Элемент",
  "БазоваяГруппа"
)
const movedFieldAddress = childUid(
  formAddress,
  "Элемент",
  "ПеремещаемоеПоле"
)
const baseButtonAddress = childUid(
  formAddress,
  "Элемент",
  "БазоваяКнопка"
)
const adoptedAttributeAddress = childUid(
  formAddress,
  "Атрибут",
  "ЗаимствованныйРеквизит"
)
const adoptedFormXmlPath = join(
  "Catalogs",
  "СправочникПолный",
  "Forms",
  "ФормаОтчета",
  "Ext",
  "Form.xml"
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
    await writeExtensionProject(projectDir)

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
    const outerMovedField = formElement(
      adoptedForm.ChildItems,
      "ПеремещаемоеПоле"
    )
    expect(outerMovedField).toMatchObject({
      kind: "CheckBoxField",
      parentName: "ГруппаРасширения",
      value: {
        HorizontalAlign: "Right",
        DataPath: "ЗаимствованныйРеквизит",
        Events: {
          Event: [
            {
              _name: "OnChange",
              _callType: "Before",
              "#text": "ПередИзменениемРасширения",
            },
            {
              _name: "OnChange",
              _callType: "After",
              "#text": "ПослеИзмененияРасширения",
            },
          ],
        },
      },
    })
    expect(array(adoptedForm.Commands.Command)).toEqual([
      expect.objectContaining({ _name: "КомандаРасширения" }),
    ])
    expect(formElement(adoptedForm.ChildItems, "КнопкаРасширения"))
      .toMatchObject({
        kind: "Button",
        value: { CommandName: "КомандаРасширения" },
      })

    const baseForm = adoptedForm.BaseForm
    expect(baseForm).toEqual(expect.objectContaining({ _version: "2.20" }))
    const baseMovedField = formElement(
      baseForm.ChildItems,
      "ПеремещаемоеПоле"
    )
    expect(baseMovedField).toMatchObject({
      kind: "InputField",
      parentName: "БазоваяГруппа",
      value: {
        _id: "11",
        HorizontalAlign: "Left",
        DataPath: "ЗаимствованныйРеквизит",
      },
    })
    expect(baseMovedField.value).not.toHaveProperty("Events")
    expect(formElement(baseForm.ChildItems, "БазоваяКнопка"))
      .toMatchObject({
        kind: "Button",
        parentName: "БазоваяГруппа",
        value: {
          _id: "12",
          CommandName: "0",
        },
      })
    expect(array(baseForm.Attributes.Attribute)).toEqual([
      expect.objectContaining({
        _name: "ЗаимствованныйРеквизит",
        _id: "1000020",
      }),
    ])
    expect(baseForm.Events).toBeUndefined()
    expect(JSON.stringify(baseForm)).not.toContain("КомандаРасширения")

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
      logicalAddress.includes("ПеремещаемоеПоле")
    )).toBe(false)
  }, 60_000)

  it("reports an assignment failure when the cf form is missing and keeps earlier XML", async () => {
    const state = await createExtensionProject({
      tempDirs,
      includeBaseForm: false,
    })

    const result = await syncExtension(state)

    expectAssignmentFailure(state.xmlDir, result.failed, /содержательным ресурсом основной конфигурации/u)
  }, 60_000)

  it("reports an assignment failure when a required cf xmlId is missing and keeps earlier XML", async () => {
    const state = await createExtensionProject({
      tempDirs,
      omittedBaseXmlId: movedFieldAddress,
    })

    const result = await syncExtension(state)

    expectAssignmentFailure(
      state.xmlDir,
      result.failed,
      /Не найден обязательный xmlId: .*ПеремещаемоеПоле/u
    )
  }, 60_000)

  it("reports an assignment failure when an explicitly borrowed cfe xmlId is missing and keeps earlier XML", async () => {
    const state = await createExtensionProject({
      tempDirs,
      includeAdoptedAttributeXmlId: false,
    })

    const result = await syncExtension(state)

    expectAssignmentFailure(
      state.xmlDir,
      result.failed,
      /Не найден обязательный xmlId: .*ЗаимствованныйРеквизит/u
    )
  }, 60_000)
})

interface ExtensionProjectOptions {
  readonly tempDirs: string[]
  readonly includeBaseForm?: boolean
  readonly omittedBaseXmlId?: string
  readonly includeAdoptedAttributeXmlId?: boolean
}

async function createExtensionProject(
  options: ExtensionProjectOptions
): Promise<{ projectDir: string; xmlDir: string }> {
  const projectDir = fs.mkdtempSync(join(os.tmpdir(), "nkdk-cfe-full-sync-"))
  options.tempDirs.push(projectDir)
  await writeExtensionProject(projectDir, options)
  return { projectDir, xmlDir: join(projectDir, "xml") }
}

async function writeExtensionProject(
  projectDir: string,
  options: Omit<ExtensionProjectOptions, "tempDirs"> = {}
): Promise<void> {
  await writeBaseConfiguration(projectDir, options)
  const imported = await importConfigurationFromXml({
    context: mockContextFromXML(),
    inputDir: extensionFixtureDir,
    projectDir,
    concurrency: 1,
    operationId: "configuration-extension-full-sync",
  })
  if (imported.failed.length > 0) {
    throw new Error(imported.failed.map(({ message }) => message).join("\n"))
  }
  writeOwnExtensionCatalog(projectDir)
  writeExtensionForm(projectDir)
  await writeExtensionFormIdentity(
    projectDir,
    options.includeAdoptedAttributeXmlId !== false
  )
}

async function writeBaseConfiguration(
  projectDir: string,
  options: Omit<ExtensionProjectOptions, "tempDirs"> = {}
): Promise<void> {
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
  if (options.includeBaseForm !== false) {
    write(
      projectDir,
      `cf/${formProjectPath}`,
      baseFormYaml()
    )
  }

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
        ...baseFormXmlIds().filter(
          ({ logicalAddress }) =>
            logicalAddress !== options.omittedBaseXmlId
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

function baseFormYaml(): string {
  return [
    "Реквизиты:",
    "  ЗаимствованныйРеквизит:",
    "    Тип: Булево",
    "  СкрытыйРеквизит:",
    "    Тип: Строка",
    "Команды:",
    "  БазоваяКоманда:",
    "    Заголовок: Базовая команда",
    "Элементы:",
    "  БазоваяГруппа:",
    "    Вид: Группа",
    "    Элементы:",
    "      ПеремещаемоеПоле:",
    "        Вид: ПолеВвода",
    "        ГоризонтальноеПоложение: Лево",
    "        ПутьКДанным: ЗаимствованныйРеквизит",
    "      БазоваяКнопка:",
    "        Вид: Кнопка",
    "        ИмяКоманды: БазоваяКоманда",
    "",
  ].join("\n")
}

function writeExtensionForm(
  projectDir: string
): void {
  write(projectDir, `cfe/РасширениеКонтроль/${formProjectPath}`, [
    "Реквизиты:",
    "  ЗаимствованныйРеквизит:",
    "    Тип: Булево",
    "  СобственныйРеквизитФормы:",
    "    Тип: Строка",
    "Команды:",
    "  КомандаРасширения:",
    "    Заголовок: Команда расширения",
    "Элементы:",
    "  ГруппаРасширения:",
    "    Вид: Группа",
    "    Элементы:",
    "      ПеремещаемоеПоле:",
    "        Вид: ПолеФлажок",
    "        ГоризонтальноеПоложение: Право",
    "        ПутьКДанным: ЗаимствованныйРеквизит",
    "        События:",
    "          ПриИзменении:",
    "            Перед: ПередИзменениемРасширения",
    "            После: ПослеИзмененияРасширения",
    "      БазоваяКнопка:",
    "        Вид: Кнопка",
    "        ИмяКоманды: БазоваяКоманда",
    "  КнопкаРасширения:",
    "    Вид: Кнопка",
    "    ИмяКоманды: КомандаРасширения",
    "",
  ].join("\n"))
}

async function writeExtensionFormIdentity(
  projectDir: string,
  includeAdoptedAttributeXmlId: boolean
): Promise<void> {
  const address = {
    kind: "configurationExtension" as const,
    name: "РасширениеКонтроль",
  }
  const snapshot = await readConfigurationIndex({ projectDir, address })
  await writeConfigurationIndexAtomically({
    projectDir,
    address,
    data: {
      ...snapshot,
      identities: [
        ...snapshot.identities.filter(
          ({ logicalAddress, kind }) =>
            logicalAddress !== adoptedAttributeAddress ||
            kind !== "xmlId"
        ),
        ...(includeAdoptedAttributeXmlId
          ? [xmlId(adoptedAttributeAddress, "1000020")]
          : []),
      ],
    },
  })
}

function baseFormXmlIds() {
  return [
    xmlId(
      childUid(formAddress, "Элемент", "ФормаКоманднаяПанель"),
      "9"
    ),
    xmlId(baseGroupAddress, "10"),
    xmlId(childSegmentUid(baseGroupAddress, "РасширеннаяПодсказка"), "100"),
    xmlId(movedFieldAddress, "11"),
    xmlId(childSegmentUid(movedFieldAddress, "КонтекстноеМеню"), "110"),
    xmlId(childSegmentUid(movedFieldAddress, "РасширеннаяПодсказка"), "111"),
    xmlId(baseButtonAddress, "12"),
    xmlId(childSegmentUid(baseButtonAddress, "РасширеннаяПодсказка"), "120"),
    xmlId(adoptedAttributeAddress, "20"),
    xmlId(childUid(formAddress, "Команда", "БазоваяКоманда"), "30"),
  ]
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

function xmlId(logicalAddress: string, value: string) {
  return { logicalAddress, kind: "xmlId" as const, value }
}

function parseXml(path: string): any {
  return importContentFromXML(fs.readFileSync(path, "utf8"))
}

function array<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value]
}

function formElement(
  childItems: unknown,
  name: string,
  parentName?: string
): { kind: string; parentName?: string; value: Record<string, any> } {
  for (const item of array(childItems)) {
    if (item === null || typeof item !== "object") continue
    for (const [kind, value] of Object.entries(item)) {
      if (value === null || typeof value !== "object") continue
      const element = value as Record<string, any>
      if (element._name === name) {
        return {
          kind,
          ...(parentName === undefined ? {} : { parentName }),
          value: element,
        }
      }
      if (element.ChildItems !== undefined) {
        try {
          return formElement(element.ChildItems, name, element._name)
        } catch {
          // Continue with the next sibling.
        }
      }
    }
  }
  throw new Error(`Не найден элемент формы "${name}"`)
}

async function syncExtension(state: {
  readonly projectDir: string
  readonly xmlDir: string
}) {
  return syncComponentToXml({
    context: mockContextToXML(),
    projectDir: state.projectDir,
    componentPath: "cfe/РасширениеКонтроль",
    xmlDir: state.xmlDir,
    concurrency: 1,
  })
}

function expectAssignmentFailure(
  xmlDir: string,
  failed: Awaited<ReturnType<typeof syncComponentToXml>>["failed"],
  message: RegExp
): void {
  expect(failed).toEqual([
    expect.objectContaining({
      code: "full_xml_sync_assignment_failed",
      assignmentId: formProjectPath,
      message: expect.stringMatching(message),
    }),
  ])
  expect(fs.existsSync(join(
    xmlDir,
    "Catalogs",
    "СправочникПолный.xml"
  ))).toBe(true)
  expect(fs.existsSync(join(xmlDir, adoptedFormXmlPath))).toBe(false)
}
