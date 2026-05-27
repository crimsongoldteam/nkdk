import fs from "fs"
import os from "os"
import { join } from "path"
import { beforeEach, describe, expect, it } from "vitest"
import { mockContextFromXML } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { syncConfigurationFromXML } from "./convertFromXML"
import { CONFIGURATION_XML_FILE, CONFIGURATION_YAML_FILE } from "./rootIO"

describe("sync configuration from xml", () => {
  const inputDir = join(__dirname, "../../../tests/fixtures/sync/syncConfiguration/xml")
  const outputDir = join(__dirname, "../../../tests/fixtures/sync/syncConfiguration/out")
  const rootCommandInterfaceFixturesDir = join(__dirname, "../../commonObjects/rootCommandInterface/__fixtures__")

  beforeEach(() => {
    if (fs.existsSync(outputDir)) {
      fs.rmSync(outputDir, { recursive: true })
    }
  })

  it("should produce catalog and form YAML in output dir", async () => {
    fs.mkdirSync(outputDir, { recursive: true })

    await syncConfigurationFromXML({
      context: mockContextFromXML(),
      inputDir,
      outputDir,
    })

    const expectedFormYaml = readXMLFileAsString(
      join("sync/syncConfiguration/yaml/Справочник/Контрагенты/Формы/ФормаЭлемента", "Форма.yaml")
    )

    const expectedCatalogYaml = readXMLFileAsString(
      join("sync/syncConfiguration/yaml/Справочник/Контрагенты", "Свойства.yaml")
    )

    const resultFormYaml = fs.readFileSync(
      join(outputDir, "Справочник", "Контрагенты", "Формы", "ФормаЭлемента", "Форма.yaml"),
      "utf-8"
    )
    const resultCatalogYaml = fs.readFileSync(join(outputDir, "Справочник", "Контрагенты", "Свойства.yaml"), "utf-8")

    expect(resultCatalogYaml).toBe(expectedCatalogYaml)
    expect(resultFormYaml).toBe(expectedFormYaml)
  })

  it("импортирует Document, DocumentNumerator и Sequence в соответствующие YAML-папки", async () => {
    fs.mkdirSync(outputDir, { recursive: true })

    await syncConfigurationFromXML({
      context: mockContextFromXML(),
      inputDir,
      outputDir,
    })

    expect(fs.existsSync(join(outputDir, "Документ", "ДокументПоУмолчанию", "Свойства.yaml"))).toBe(true)
    expect(fs.existsSync(join(outputDir, "Нумератор", "НумераторПоУмолчанию", "Свойства.yaml"))).toBe(true)
    expect(fs.existsSync(join(outputDir, "Последовательность", "ПоследовательностьПоУмолчанию", "Свойства.yaml"))).toBe(
      true
    )
  })

  it("не падает на дампе без некоторых корневых разделов", async () => {
    const partialInput = join(__dirname, "../../../tests/fixtures/sync/_partial_xml_tmp")
    if (fs.existsSync(partialInput)) fs.rmSync(partialInput, { recursive: true })
    fs.mkdirSync(join(partialInput, "Catalogs"), { recursive: true })
    fs.mkdirSync(outputDir, { recursive: true })

    const result = await syncConfigurationFromXML({
      context: mockContextFromXML(),
      inputDir: partialInput,
      outputDir,
    })

    expect(result.failed).toEqual([])

    fs.rmSync(partialInput, { recursive: true })
  })

  it("пишет корневой файл Конфигурация.yaml из Configuration.xml", async () => {
    const tmp = fs.mkdtempSync(join(os.tmpdir(), "nkdk-root-from-xml-"))
    const rootInput = join(tmp, "xml")
    const rootOutput = join(tmp, "yaml")
    try {
      fs.mkdirSync(rootInput, { recursive: true })
      fs.copyFileSync(
        join(__dirname, "../../../tests/fixtures/configuration/full.xml"),
        join(rootInput, CONFIGURATION_XML_FILE)
      )

      await syncConfigurationFromXML({
        context: mockContextFromXML(),
        inputDir: rootInput,
        outputDir: rootOutput,
      })

      const yaml = fs.readFileSync(join(rootOutput, CONFIGURATION_YAML_FILE), "utf-8")
      expect(yaml).toContain("Имя: Конфигурация")
      expect(yaml).not.toContain("ChildObjects")
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })

  it("импортирует корневые command interface XML в Конфигурация.yaml", async () => {
    const tmp = fs.mkdtempSync(join(os.tmpdir(), "nkdk-root-command-interface-from-xml-"))
    const rootInput = join(tmp, "xml")
    const rootOutput = join(tmp, "yaml")
    try {
      fs.mkdirSync(join(rootInput, "Ext"), { recursive: true })
      fs.copyFileSync(
        join(__dirname, "../../../tests/fixtures/configuration/minimal.xml"),
        join(rootInput, CONFIGURATION_XML_FILE)
      )
      fs.copyFileSync(
        join(rootCommandInterfaceFixturesDir, "CommandInterface.xml"),
        join(rootInput, "Ext", "CommandInterface.xml")
      )
      fs.copyFileSync(
        join(rootCommandInterfaceFixturesDir, "MainSectionCommandInterface.xml"),
        join(rootInput, "Ext", "MainSectionCommandInterface.xml")
      )

      await syncConfigurationFromXML({
        context: mockContextFromXML(),
        inputDir: rootInput,
        outputDir: rootOutput,
      })

      const yaml = fs.readFileSync(join(rootOutput, CONFIGURATION_YAML_FILE), "utf-8")
      expect(yaml).toContain("КомандныйИнтерфейс:")
      expect(yaml).toContain("ВидимостьПодсистем:")
      expect(yaml).toContain("ПодсистемаПоУмолчанию:")
      expect(yaml).toContain("КомандныйИнтерфейсОсновногоРаздела:")
      expect(yaml).toContain("ПорядокГрупп:")
      expect(yaml).toContain("ПанельНавигацииВажное")
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })

  it("сохраняет простые корневые внешние файлы конфигурации", async () => {
    const tmp = fs.mkdtempSync(join(os.tmpdir(), "nkdk-root-external-from-xml-"))
    const rootInput = join(tmp, "xml")
    const rootOutput = join(tmp, "yaml")
    const managedApplicationModule = "Процедура ПриНачалеРаботыСистемы()\nКонецПроцедуры\n"
    const sessionModule = "Процедура ПриНачалеСеанса()\nКонецПроцедуры\n"
    const externalConnectionModule = "Процедура ПриНачалеРаботыСистемы()\nКонецПроцедуры\n"
    const ordinaryApplicationModule = "Процедура ПередНачаломРаботыСистемы()\nКонецПроцедуры\n"

    try {
      fs.mkdirSync(join(rootInput, "Ext", "MainSectionPicture"), { recursive: true })
      fs.mkdirSync(join(rootInput, "Ext", "Splash"), { recursive: true })
      fs.copyFileSync(
        join(__dirname, "../../../tests/fixtures/configuration/minimal.xml"),
        join(rootInput, CONFIGURATION_XML_FILE)
      )
      fs.writeFileSync(join(rootInput, "Ext", "ManagedApplicationModule.bsl"), managedApplicationModule, "utf-8")
      fs.writeFileSync(join(rootInput, "Ext", "SessionModule.bsl"), sessionModule, "utf-8")
      fs.writeFileSync(join(rootInput, "Ext", "ExternalConnectionModule.bsl"), externalConnectionModule, "utf-8")
      fs.writeFileSync(join(rootInput, "Ext", "OrdinaryApplicationModule.bsl"), ordinaryApplicationModule, "utf-8")
      fs.writeFileSync(join(rootInput, "Ext", "MobileClientSignature.bin"), Buffer.from([0, 1, 2, 255]))
      fs.writeFileSync(join(rootInput, "Ext", "MainSectionPicture.xml"), "<MainSectionPicture/>", "utf-8")
      fs.writeFileSync(join(rootInput, "Ext", "MainSectionPicture", "Picture.svg"), "<svg/>", "utf-8")
      fs.writeFileSync(join(rootInput, "Ext", "Splash.xml"), "<Splash/>", "utf-8")
      fs.writeFileSync(join(rootInput, "Ext", "Splash", "Picture.png"), Buffer.from([137, 80, 78, 71]))

      await syncConfigurationFromXML({
        context: mockContextFromXML(),
        inputDir: rootInput,
        outputDir: rootOutput,
      })

      expect(fs.readFileSync(join(rootOutput, "МодульПриложения.bsl"), "utf-8")).toBe(managedApplicationModule)
      expect(fs.readFileSync(join(rootOutput, "МодульСеанса.bsl"), "utf-8")).toBe(sessionModule)
      expect(fs.readFileSync(join(rootOutput, "МодульВнешнегоСоединения.bsl"), "utf-8")).toBe(externalConnectionModule)
      expect(fs.readFileSync(join(rootOutput, "МодульОбычногоПриложения.bsl"), "utf-8")).toBe(ordinaryApplicationModule)
      expect([...fs.readFileSync(join(rootOutput, "ПодписьМобильногоКлиента.bin"))]).toEqual([0, 1, 2, 255])
      expect(fs.readFileSync(join(rootOutput, "КартинкаОсновногоРаздела", "MainSectionPicture.xml"), "utf-8")).toBe(
        "<MainSectionPicture/>"
      )
      expect(fs.readFileSync(join(rootOutput, "КартинкаОсновногоРаздела", "Picture.svg"), "utf-8")).toBe("<svg/>")
      expect(fs.readFileSync(join(rootOutput, "Заставка", "Splash.xml"), "utf-8")).toBe("<Splash/>")
      expect([...fs.readFileSync(join(rootOutput, "Заставка", "Picture.png"))]).toEqual([137, 80, 78, 71])
      expect(fs.readFileSync(join(rootOutput, CONFIGURATION_YAML_FILE), "utf-8")).not.toContain("МодульПриложения")
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })
})
