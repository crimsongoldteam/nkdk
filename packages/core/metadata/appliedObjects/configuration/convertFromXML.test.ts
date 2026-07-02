import fs from "fs"
import os from "os"
import { join } from "path"
import { beforeEach, describe, expect, it } from "vitest"
import { mockContextFromXML } from "../../../tests/mockContext"
import { readXMLFileAsString } from "../../../tests/readAndParseXMLFile"
import { syncConfigurationFromXML } from "./convertFromXML"
import { CONFIGURATION_XML_FILE, CONFIGURATION_YAML_FILE } from "./rootIO"

describe("sync configuration from xml", () => {
  const inputDir = join(__dirname, "__fixtures__/syncConfiguration/xml")
  const outputDir = join(__dirname, "__fixtures__/syncConfiguration/out")
  const rootCommandInterfaceFixturesDir = join(__dirname, "../../commonObjects/rootCommandInterface/__fixtures__")
  const clientApplicationInterfaceFixturesDir = join(
    __dirname,
    "../../commonObjects/clientApplicationInterface/__fixtures__"
  )
  const homePageWorkAreaXML = `<?xml version="1.0" encoding="UTF-8"?>
<HomePageWorkArea xmlns="http://v8.1c.ru/8.3/xcf/extrnprops" xmlns:xr="http://v8.1c.ru/8.3/xcf/readable" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20">
\t<WorkingAreaTemplate>TwoColumnsVariableWidth</WorkingAreaTemplate>
\t<LeftColumn>
\t\t<Item>
\t\t\t<Form>CommonForm.НачалоРаботы</Form>
\t\t\t<Height>100</Height>
\t\t\t<Visibility>
\t\t\t\t<xr:Common>true</xr:Common>
\t\t\t\t<xr:Value name="Role.Администратор">false</xr:Value>
\t\t\t</Visibility>
\t\t</Item>
\t</LeftColumn>
\t<RightColumn>
\t\t<Item>
\t\t\t<Form>DataProcessor.ИнформационныйЦентр.Form.ИнформационныйЦентр</Form>
\t\t\t<Height>10</Height>
\t\t\t<Visibility>
\t\t\t\t<xr:Common>false</xr:Common>
\t\t\t</Visibility>
\t\t</Item>
\t</RightColumn>
\t<MACommandInterfaceDisplays>Top</MACommandInterfaceDisplays>
</HomePageWorkArea>`

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
    const partialInput = join(__dirname, "__fixtures__/_partial_xml_tmp")
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
      fs.copyFileSync(join(__dirname, "__fixtures__/full.xml"), join(rootInput, CONFIGURATION_XML_FILE))

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
      fs.copyFileSync(join(__dirname, "__fixtures__/minimal.xml"), join(rootInput, CONFIGURATION_XML_FILE))
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

  it("импортирует корневой ClientApplicationInterface.xml в Конфигурация.yaml", async () => {
    const tmp = fs.mkdtempSync(join(os.tmpdir(), "nkdk-client-interface-from-xml-"))
    const rootInput = join(tmp, "xml")
    const rootOutput = join(tmp, "yaml")
    try {
      fs.mkdirSync(join(rootInput, "Ext"), { recursive: true })
      fs.copyFileSync(join(__dirname, "__fixtures__/minimal.xml"), join(rootInput, CONFIGURATION_XML_FILE))
      fs.copyFileSync(
        join(clientApplicationInterfaceFixturesDir, "ClientApplicationInterface.xml"),
        join(rootInput, "Ext", "ClientApplicationInterface.xml")
      )

      await syncConfigurationFromXML({
        context: mockContextFromXML(),
        inputDir: rootInput,
        outputDir: rootOutput,
      })

      const yaml = fs.readFileSync(join(rootOutput, CONFIGURATION_YAML_FILE), "utf-8")
      expect(yaml).toContain("ИнтерфейсКлиентскогоПриложения:")
      expect(yaml).toContain("Верх:")
      expect(yaml).toContain("ПанельФункцийТекущегоРаздела")
      expect(yaml).toContain("Представление: КартинкаСлеваИТекст")
      expect(yaml).not.toContain("left-history")
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })

  it("импортирует корневой HomePageWorkArea.xml в Конфигурация.yaml", async () => {
    const tmp = fs.mkdtempSync(join(os.tmpdir(), "nkdk-home-page-work-area-from-xml-"))
    const rootInput = join(tmp, "xml")
    const rootOutput = join(tmp, "yaml")
    try {
      fs.mkdirSync(join(rootInput, "Ext"), { recursive: true })
      fs.copyFileSync(join(__dirname, "__fixtures__/minimal.xml"), join(rootInput, CONFIGURATION_XML_FILE))
      fs.writeFileSync(join(rootInput, "Ext", "HomePageWorkArea.xml"), homePageWorkAreaXML, "utf-8")

      await syncConfigurationFromXML({
        context: mockContextFromXML(),
        inputDir: rootInput,
        outputDir: rootOutput,
      })

      const yaml = fs.readFileSync(join(rootOutput, CONFIGURATION_YAML_FILE), "utf-8")
      expect(yaml).toContain("РабочаяОбластьНачальнойСтраницы:")
      expect(yaml).toContain("ШаблонРабочейОбласти: ДвеКолонкиПеременнойШирины")
      expect(yaml).toContain("Форма: CommonForm.НачалоРаботы")
      expect(yaml).toContain("Администратор: Ложь")
      expect(yaml).toContain("ОтображениеКомандногоИнтерфейса: Верх")
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
    const helpPage = "<html><body>Справка</body></html>"

    try {
      fs.mkdirSync(join(rootInput, "Ext", "Help", "_files"), { recursive: true })
      fs.mkdirSync(join(rootInput, "Ext", "Logo"), { recursive: true })
      fs.mkdirSync(join(rootInput, "Ext", "MainSectionPicture"), { recursive: true })
      fs.mkdirSync(join(rootInput, "Ext", "Splash"), { recursive: true })
      fs.copyFileSync(join(__dirname, "__fixtures__/minimal.xml"), join(rootInput, CONFIGURATION_XML_FILE))
      fs.writeFileSync(join(rootInput, "Ext", "ManagedApplicationModule.bsl"), managedApplicationModule, "utf-8")
      fs.writeFileSync(join(rootInput, "Ext", "SessionModule.bsl"), sessionModule, "utf-8")
      fs.writeFileSync(join(rootInput, "Ext", "ExternalConnectionModule.bsl"), externalConnectionModule, "utf-8")
      fs.writeFileSync(join(rootInput, "Ext", "OrdinaryApplicationModule.bsl"), ordinaryApplicationModule, "utf-8")
      fs.writeFileSync(join(rootInput, "Ext", "MobileClientSignature.bin"), Buffer.from([0, 1, 2, 255]))
      fs.writeFileSync(
        join(rootInput, "Ext", "Help.xml"),
        `<?xml version="1.0" encoding="UTF-8"?>\n<Help xmlns="http://v8.1c.ru/8.3/xcf/extrnprops" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20">\n\t<Page>ru</Page>\n</Help>`,
        "utf-8"
      )
      fs.writeFileSync(join(rootInput, "Ext", "Help", "ru.html"), helpPage, "utf-8")
      fs.writeFileSync(join(rootInput, "Ext", "Help", "_files", "logo.png"), Buffer.from([137, 80]))
      fs.writeFileSync(join(rootInput, "Ext", "MainSectionPicture.xml"), "<MainSectionPicture/>", "utf-8")
      fs.writeFileSync(join(rootInput, "Ext", "MainSectionPicture", "Picture.svg"), "<svg/>", "utf-8")
      fs.writeFileSync(join(rootInput, "Ext", "Logo.xml"), "<Logo/>", "utf-8")
      fs.writeFileSync(join(rootInput, "Ext", "Logo", "Picture.png"), Buffer.from([1, 2, 3]))
      fs.writeFileSync(join(rootInput, "Ext", "Splash.xml"), "<Splash/>", "utf-8")
      fs.writeFileSync(join(rootInput, "Ext", "Splash", "Picture.png"), Buffer.from([137, 80, 78, 71]))
      fs.writeFileSync(join(rootInput, "Ext", "StandaloneConfigurationContent.bin"), Buffer.from([4, 5, 6]))

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
      expect(fs.readFileSync(join(rootOutput, "Справка", "ru.html"), "utf-8")).toBe(helpPage)
      expect([...fs.readFileSync(join(rootOutput, "Справка", "_files", "logo.png"))]).toEqual([137, 80])
      expect(fs.readFileSync(join(rootOutput, "КартинкаОсновногоРаздела", "MainSectionPicture.xml"), "utf-8")).toBe(
        "<MainSectionPicture/>"
      )
      expect(fs.readFileSync(join(rootOutput, "КартинкаОсновногоРаздела", "Picture.svg"), "utf-8")).toBe("<svg/>")
      expect(fs.readFileSync(join(rootOutput, "Логотип", "Logo.xml"), "utf-8")).toBe("<Logo/>")
      expect([...fs.readFileSync(join(rootOutput, "Логотип", "Picture.png"))]).toEqual([1, 2, 3])
      expect(fs.readFileSync(join(rootOutput, "Заставка", "Splash.xml"), "utf-8")).toBe("<Splash/>")
      expect([...fs.readFileSync(join(rootOutput, "Заставка", "Picture.png"))]).toEqual([137, 80, 78, 71])
      expect([...fs.readFileSync(join(rootOutput, "СодержимоеАвтономнойКонфигурации.bin"))]).toEqual([4, 5, 6])
      expect(fs.readFileSync(join(rootOutput, CONFIGURATION_YAML_FILE), "utf-8")).not.toContain("МодульПриложения")
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })

  it("импортирует корневые внешние файлы конфигурации из Ext", async () => {
    const rootInput = fs.mkdtempSync(join(os.tmpdir(), "configuration-xml-"))
    const outputDir = fs.mkdtempSync(join(os.tmpdir(), "configuration-yaml-"))
    try {
      fs.copyFileSync(new URL("__fixtures__/minimal.xml", import.meta.url), join(rootInput, "Configuration.xml"))
      fs.mkdirSync(join(rootInput, "Ext"), { recursive: true })
      fs.writeFileSync(
        join(rootInput, "Ext", "ManagedApplicationModule.bsl"),
        "Процедура ПриЗапускеСистемы()\nКонецПроцедуры\n",
        "utf-8"
      )
      fs.copyFileSync(
        join(rootCommandInterfaceFixturesDir, "CommandInterface.xml"),
        join(rootInput, "Ext", "CommandInterface.xml")
      )

      await syncConfigurationFromXML({
        context: mockContextFromXML(),
        inputDir: rootInput,
        outputDir,
      })

      expect(fs.readFileSync(join(outputDir, "МодульПриложения.bsl"), "utf-8")).toBe(
        "Процедура ПриЗапускеСистемы()\nКонецПроцедуры\n"
      )
      expect(fs.readFileSync(join(outputDir, CONFIGURATION_YAML_FILE), "utf-8")).toContain("КомандныйИнтерфейс:")
    } finally {
      fs.rmSync(rootInput, { recursive: true, force: true })
      fs.rmSync(outputDir, { recursive: true, force: true })
    }
  })
})
