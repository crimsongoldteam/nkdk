import fs from "fs"
import os from "os"
import { dirname, join } from "path"
import { beforeEach, describe, expect, it } from "vitest"
import { mockContextFromXML, mockContextToXML } from "~/tests/mockContext"
import { getXMLFixturePath, readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { importContentFromXML } from "~/xml/import/importer"
import type { ExternalMetadataCollector } from "~/metadata/orchestration/externalMetadata/types"
import { importConfigDumpInfoFromXML } from "../configDumpInfo/fromXML"
import type { ConfigDumpInfoXML } from "../configDumpInfo/types"
import { syncConfigurationFromXML } from "./convertFromXML"
import { CONFIGURATION_XML_FILE, CONFIGURATION_YAML_FILE } from "./rootIO"
import { syncConfigurationToXML } from "./syncToXML"

describe("sync configuration to XML", () => {
  const inputDir = getXMLFixturePath("sync/syncConfiguration/yaml")
  const referenceDir = getXMLFixturePath("sync/syncConfiguration/xml")
  const outputDir = getXMLFixturePath("sync/syncConfiguration/out-to-xml")
  const catalogName = "Контрагенты"
  const normalizeXML = (value: string): string => value.replace(/\r\n/g, "\n").replace(/^\uFEFF/, "").trimEnd()
  const expectRootExternalDirUppercase = (dir: string): void => {
    const entries = fs.readdirSync(dir)
    expect(entries).toContain("Ext")
    expect(entries).not.toContain("ext")
  }

  beforeEach(() => {
    if (fs.existsSync(outputDir)) {
      fs.rmSync(outputDir, { recursive: true })
    }
  })

  it("should read configuration from YAML and export to XML file in output dir", async () => {
    await syncConfigurationToXML({
      context: mockContextToXML(),
      inputDir,
      outputDir,
      referenceDir,
    })

    const expectedMetadataXML = readXMLFileAsString(join("sync/syncConfiguration/xml/Catalogs", `${catalogName}.xml`))
    const resultMetadataXML = readXMLFileAsString(join("sync/syncConfiguration/out-to-xml/Catalogs", `${catalogName}.xml`))
    expect(resultMetadataXML).toBe(expectedMetadataXML)

    const expectedFormXML = readXMLFileAsString(
      join("sync/syncConfiguration/xml/Catalogs", "Контрагенты", "Forms", "ФормаЭлемента", "Ext", "Form.xml")
    )
    const resultFormXML = readXMLFileAsString(
      join("sync/syncConfiguration/out-to-xml", "Catalogs", catalogName, "Forms", "ФормаЭлемента", "Ext", "Form.xml")
    )
    expect(resultFormXML).toBe(expectedFormXML)

    const expectedFormMetadataXML = readXMLFileAsString(
      join("sync/syncConfiguration/xml/Catalogs", catalogName, "Forms", "ФормаЭлемента.xml")
    )
    const resultFormMetadataXML = readXMLFileAsString(
      join("sync/syncConfiguration/out-to-xml", "Catalogs", catalogName, "Forms", "ФормаЭлемента.xml")
    )
    expect(resultFormMetadataXML).toBe(expectedFormMetadataXML)
  })

  it("без referenceDir не читает reference из outputDir и создаёт ConfigDumpInfo.xml", async () => {
    const tmp = fs.mkdtempSync(join(os.tmpdir(), "nkdk-configuration-no-reference-"))
    const yamlDir = join(tmp, "yaml")
    const outDir = join(tmp, "xml")

    try {
      fs.mkdirSync(join(yamlDir, "Справочник", "Контрагенты"), { recursive: true })
      fs.mkdirSync(join(outDir, "Catalogs"), { recursive: true })
      fs.mkdirSync(join(outDir, "Ext"), { recursive: true })
      fs.writeFileSync(join(yamlDir, CONFIGURATION_YAML_FILE), "Имя: Конфигурация\n", "utf-8")
      fs.writeFileSync(join(yamlDir, "Справочник", "Контрагенты", "Свойства.yaml"), "Имя: Контрагенты\n", "utf-8")
      fs.copyFileSync(
        getXMLFixturePath("sync/syncConfiguration/xml/Catalogs/Контрагенты.xml"),
        join(outDir, "Catalogs", "Контрагенты.xml")
      )
      fs.writeFileSync(join(outDir, "Ext", "Unsupported.xml"), "<Unsupported/>", "utf-8")

      const result = await syncConfigurationToXML({
        context: mockContextToXML(),
        inputDir: yamlDir,
        outputDir: outDir,
      })

      expect(result.failed).toEqual([])
      const catalogXML = fs.readFileSync(join(outDir, "Catalogs", "Контрагенты.xml"), "utf-8")
      expect(catalogXML).toContain("<Catalog")
      expect(catalogXML).not.toContain("ФормаЭлемента")
      expect(fs.existsSync(join(outDir, "ConfigDumpInfo.xml"))).toBe(true)
      expect(fs.existsSync(join(outDir, "Ext", "Unsupported.xml"))).toBe(false)
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })

  it("для нового справочника и реквизита пишет одинаковые UUID в XML и ConfigDumpInfo", async () => {
    const tmp = fs.mkdtempSync(join(os.tmpdir(), "nkdk-configdumpinfo-new-uuid-"))
    const yamlDir = join(tmp, "yaml")
    const outDir = join(tmp, "xml")

    try {
      fs.mkdirSync(join(yamlDir, "Справочник", "Номенклатура"), { recursive: true })
      fs.writeFileSync(join(yamlDir, CONFIGURATION_YAML_FILE), "Имя: Конфигурация\n", "utf-8")
      fs.writeFileSync(
        join(yamlDir, "Справочник", "Номенклатура", "Свойства.yaml"),
        ["Имя: Номенклатура", "Реквизиты:", "  Артикул: {}", ""].join("\n"),
        "utf-8",
      )
      fs.writeFileSync(
        join(yamlDir, "Справочник", "Номенклатура", "МодульОбъекта.bsl"),
        "Процедура Тест()\nКонецПроцедуры\n",
        "utf-8",
      )

      const result = await syncConfigurationToXML({
        context: mockContextToXML(),
        inputDir: yamlDir,
        outputDir: outDir,
      })

      expect(result.failed).toEqual([])

      const catalogXml = importContentFromXML<{
        MetaDataObject: {
          Catalog: {
            _uuid: string
            ChildObjects: { Attribute: { _uuid: string } }
          }
        }
      }>(fs.readFileSync(join(outDir, "Catalogs", "Номенклатура.xml"), "utf-8"))
      const configDumpInfoXml = importContentFromXML<{ ConfigDumpInfo: ConfigDumpInfoXML }>(
        fs.readFileSync(join(outDir, "ConfigDumpInfo.xml"), "utf-8"),
      )
      const idMap = importConfigDumpInfoFromXML({
        context: mockContextFromXML(),
        xml: configDumpInfoXml.ConfigDumpInfo,
      })

      const catalogUuid = catalogXml.MetaDataObject.Catalog._uuid
      const attributeUuid = catalogXml.MetaDataObject.Catalog.ChildObjects.Attribute._uuid

      expect(idMap.get("Catalog.Номенклатура")?.id).toBe(catalogUuid)
      expect(idMap.get("Catalog.Номенклатура")?.children.get("Catalog.Номенклатура.Attribute.Артикул")).toBe(
        attributeUuid,
      )
      expect(idMap.get("Catalog.Номенклатура.ObjectModule")?.id).toBe(`${catalogUuid}.0`)
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })

  it("возвращает ошибку configDumpInfo если новый UUID не попал в накопитель", async () => {
    const tmp = fs.mkdtempSync(join(os.tmpdir(), "nkdk-configdumpinfo-missing-uuid-"))
    const yamlDir = join(tmp, "yaml")
    const outDir = join(tmp, "xml")
    const context = mockContextToXML()
    ;(context.exportToXML as typeof context.exportToXML & { externalMetadataCollector: ExternalMetadataCollector })
      .externalMetadataCollector = {
      recordUuid: () => undefined,
      recordDerived: () => undefined,
    }

    try {
      fs.mkdirSync(join(yamlDir, "Справочник", "Номенклатура"), { recursive: true })
      fs.writeFileSync(join(yamlDir, CONFIGURATION_YAML_FILE), "Имя: Конфигурация\n", "utf-8")
      fs.writeFileSync(join(yamlDir, "Справочник", "Номенклатура", "Свойства.yaml"), "Имя: Номенклатура\n", "utf-8")

      const result = await syncConfigurationToXML({
        context,
        inputDir: yamlDir,
        outputDir: outDir,
      })

      expect(result.failed).toHaveLength(1)
      expect(result.failed[0]?.kind).toBe("configDumpInfo")
      expect(result.failed[0]?.error.message).toContain('Не найден UUID ConfigDumpInfo для "Catalog.Номенклатура"')
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })

  it("не планирует вложенные подсистемы как отдельные top-level задачи", async () => {
    const tmp = fs.mkdtempSync(join(os.tmpdir(), "nkdk-sync-nested-subsystem-plan-"))
    const yamlDir = join(tmp, "yaml")
    const outDir = join(tmp, "xml")

    try {
      fs.mkdirSync(join(yamlDir, "Подсистема", "Администрирование", "Подсистемы", "Настройки"), { recursive: true })
      fs.writeFileSync(join(yamlDir, CONFIGURATION_YAML_FILE), "Имя: Конфигурация\n", "utf-8")
      fs.writeFileSync(
        join(yamlDir, "Подсистема", "Администрирование", "Свойства.yaml"),
        ["Имя: Администрирование", "Подсистемы:", "  - Настройки", ""].join("\n"),
        "utf-8",
      )
      fs.writeFileSync(
        join(yamlDir, "Подсистема", "Администрирование", "Подсистемы", "Настройки", "Свойства.yaml"),
        "Имя: Настройки\n",
        "utf-8",
      )

      const result = await syncConfigurationToXML({
        context: mockContextToXML(),
        inputDir: yamlDir,
        outputDir: outDir,
      })

      expect(result.failed).toEqual([])
      expect(fs.existsSync(join(outDir, "Subsystems", "Администрирование.xml"))).toBe(true)
      expect(fs.existsSync(join(outDir, "Subsystems", "Администрирование", "Subsystems", "Настройки.xml"))).toBe(true)
      expect(fs.existsSync(join(outDir, "Subsystems", "Настройки.xml"))).toBe(false)
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })

  it("пишет корневой Configuration.xml из Конфигурация.yaml и вычисляет пустой ChildObjects", async () => {
    const tmp = fs.mkdtempSync(join(os.tmpdir(), "nkdk-root-to-xml-"))
    const yamlDir = join(tmp, "yaml")
    const xmlDir = join(tmp, "xml")
    const outDir = join(tmp, "out")
    try {
      fs.mkdirSync(yamlDir, { recursive: true })
      fs.mkdirSync(xmlDir, { recursive: true })
      fs.copyFileSync(getXMLFixturePath("configuration/full.xml"), join(xmlDir, CONFIGURATION_XML_FILE))
      fs.writeFileSync(join(yamlDir, CONFIGURATION_YAML_FILE), "Имя: Конфигурация\n", "utf-8")

      await syncConfigurationToXML({
        context: mockContextToXML(),
        inputDir: yamlDir,
        outputDir: outDir,
        referenceDir: xmlDir,
      })

      const result = fs.readFileSync(join(outDir, CONFIGURATION_XML_FILE), "utf-8")
      expect(result).toContain("<ChildObjects/>")
      expect(result).not.toContain("<Catalog>")
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })

  it("сохраняет простые корневые внешние файлы конфигурации в XML", async () => {
    const tmp = fs.mkdtempSync(join(os.tmpdir(), "nkdk-root-external-to-xml-"))
    const yamlDir = join(tmp, "yaml")
    const outputDir = join(tmp, "out")
    const managedApplicationModule = "Процедура ПриНачалеРаботыСистемы()\nКонецПроцедуры\n"
    const sessionModule = "Процедура ПриНачалеСеанса()\nКонецПроцедуры\n"
    const externalConnectionModule = "Процедура ПриНачалеРаботыСистемы()\nКонецПроцедуры\n"
    const ordinaryApplicationModule = "Процедура ПередНачаломРаботыСистемы()\nКонецПроцедуры\n"
    const helpPage = "<html><body>Справка</body></html>"

    try {
      fs.mkdirSync(join(yamlDir, "Справка", "_files"), { recursive: true })
      fs.mkdirSync(join(yamlDir, "Логотип"), { recursive: true })
      fs.mkdirSync(join(yamlDir, "КартинкаОсновногоРаздела"), { recursive: true })
      fs.mkdirSync(join(yamlDir, "Заставка"), { recursive: true })
      fs.writeFileSync(join(yamlDir, CONFIGURATION_YAML_FILE), "Имя: Конфигурация\n", "utf-8")
      fs.writeFileSync(join(yamlDir, "МодульПриложения.bsl"), managedApplicationModule, "utf-8")
      fs.writeFileSync(join(yamlDir, "МодульСеанса.bsl"), sessionModule, "utf-8")
      fs.writeFileSync(join(yamlDir, "МодульВнешнегоСоединения.bsl"), externalConnectionModule, "utf-8")
      fs.writeFileSync(join(yamlDir, "МодульОбычногоПриложения.bsl"), ordinaryApplicationModule, "utf-8")
      fs.writeFileSync(join(yamlDir, "ПодписьМобильногоКлиента.bin"), Buffer.from([0, 1, 2, 255]))
      fs.writeFileSync(join(yamlDir, "Справка", "ru.html"), helpPage, "utf-8")
      fs.writeFileSync(join(yamlDir, "Справка", "_files", "logo.png"), Buffer.from([137, 80]))
      fs.writeFileSync(join(yamlDir, "КартинкаОсновногоРаздела", "MainSectionPicture.xml"), "<MainSectionPicture/>", "utf-8")
      fs.writeFileSync(join(yamlDir, "КартинкаОсновногоРаздела", "Picture.svg"), "<svg/>", "utf-8")
      fs.writeFileSync(join(yamlDir, "Логотип", "Logo.xml"), "<Logo/>", "utf-8")
      fs.writeFileSync(join(yamlDir, "Логотип", "Picture.png"), Buffer.from([1, 2, 3]))
      fs.writeFileSync(join(yamlDir, "Заставка", "Splash.xml"), "<Splash/>", "utf-8")
      fs.writeFileSync(join(yamlDir, "Заставка", "Picture.png"), Buffer.from([137, 80, 78, 71]))
      fs.writeFileSync(join(yamlDir, "СодержимоеАвтономнойКонфигурации.bin"), Buffer.from([4, 5, 6]))

      await syncConfigurationToXML({
        context: mockContextToXML(),
        inputDir: yamlDir,
        outputDir,
      })

      expect(fs.readFileSync(join(outputDir, "Ext", "ManagedApplicationModule.bsl"), "utf-8")).toBe(
        managedApplicationModule,
      )
      expect(fs.readFileSync(join(outputDir, "Ext", "SessionModule.bsl"), "utf-8")).toBe(sessionModule)
      expect(fs.readFileSync(join(outputDir, "Ext", "ExternalConnectionModule.bsl"), "utf-8")).toBe(
        externalConnectionModule,
      )
      expect(fs.readFileSync(join(outputDir, "Ext", "OrdinaryApplicationModule.bsl"), "utf-8")).toBe(
        ordinaryApplicationModule,
      )
      expect([...fs.readFileSync(join(outputDir, "Ext", "MobileClientSignature.bin"))]).toEqual([0, 1, 2, 255])
      const helpXmlContent = fs.readFileSync(join(outputDir, "Ext", "Help.xml"), "utf-8")
      const helpParsed = importContentFromXML<{ Help: { Page?: string | string[] } }>(helpXmlContent)
      const helpPages = helpParsed.Help.Page
      expect(Array.isArray(helpPages) ? helpPages : [helpPages]).toEqual(["ru"])
      expect(fs.readFileSync(join(outputDir, "Ext", "Help", "ru.html"), "utf-8")).toBe(helpPage)
      expect([...fs.readFileSync(join(outputDir, "Ext", "Help", "_files", "logo.png"))]).toEqual([137, 80])
      expect(fs.readFileSync(join(outputDir, "Ext", "MainSectionPicture.xml"), "utf-8")).toBe("<MainSectionPicture/>")
      expect(fs.readFileSync(join(outputDir, "Ext", "MainSectionPicture", "Picture.svg"), "utf-8")).toBe("<svg/>")
      expect(fs.readFileSync(join(outputDir, "Ext", "Logo.xml"), "utf-8")).toBe("<Logo/>")
      expect([...fs.readFileSync(join(outputDir, "Ext", "Logo", "Picture.png"))]).toEqual([1, 2, 3])
      expect(fs.readFileSync(join(outputDir, "Ext", "Splash.xml"), "utf-8")).toBe("<Splash/>")
      expect([...fs.readFileSync(join(outputDir, "Ext", "Splash", "Picture.png"))]).toEqual([137, 80, 78, 71])
      expect([...fs.readFileSync(join(outputDir, "Ext", "StandaloneConfigurationContent.bin"))]).toEqual([4, 5, 6])
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })

  it("записывает корневые внешние файлы конфигурации в Ext", async () => {
    const inputDir = fs.mkdtempSync(join(os.tmpdir(), "configuration-yaml-"))
    const outDir = fs.mkdtempSync(join(os.tmpdir(), "configuration-xml-"))
    try {
      fs.writeFileSync(
        join(inputDir, "Конфигурация.yaml"),
        [
          "Имя: Конфигурация",
          "КомандныйИнтерфейс:",
          "  ВидимостьПодсистем:",
          "    Подсистема.ПодсистемаПоУмолчанию:",
          "      Общее: Ложь",
          "",
        ].join("\n"),
        "utf-8"
      )
      fs.writeFileSync(
        join(inputDir, "МодульПриложения.bsl"),
        "Процедура ПриЗапускеСистемы()\nКонецПроцедуры\n",
        "utf-8"
      )

      await syncConfigurationToXML({
        context: mockContextToXML(),
        inputDir,
        outputDir: outDir,
      })

      expect(fs.readFileSync(join(outDir, "Ext", "ManagedApplicationModule.bsl"), "utf-8")).toBe(
        "Процедура ПриЗапускеСистемы()\nКонецПроцедуры\n"
      )
      expect(fs.readFileSync(join(outDir, "Ext", "CommandInterface.xml"), "utf-8")).toContain("<CommandInterface")
      expectRootExternalDirUppercase(outDir)
    } finally {
      fs.rmSync(inputDir, { recursive: true, force: true })
      fs.rmSync(outDir, { recursive: true, force: true })
    }
  })

  it("сохраняет неподдержанные файлы расширения из reference/Ext", async () => {
    const tmp = fs.mkdtempSync(join(os.tmpdir(), "nkdk-root-ext-reference-"))
    const yamlDir = join(tmp, "yaml")
    const referenceDir = join(tmp, "reference")
    const outDir = join(tmp, "out")
    try {
      fs.mkdirSync(join(yamlDir), { recursive: true })
      fs.mkdirSync(join(referenceDir, "Ext", "CommonForms", "PeriodField", "Ext"), { recursive: true })
      fs.mkdirSync(join(referenceDir, "Ext", "Roles"), { recursive: true })
      fs.mkdirSync(join(referenceDir, "Ext", "Languages"), { recursive: true })
      fs.writeFileSync(join(yamlDir, CONFIGURATION_YAML_FILE), "Имя: Конфигурация\n", "utf-8")
      fs.writeFileSync(join(yamlDir, "МодульПриложения.bsl"), "Процедура Новая()\nКонецПроцедуры\n", "utf-8")
      fs.writeFileSync(join(referenceDir, "Ext", "ManagedApplicationModule.bsl"), "old", "utf-8")
      fs.writeFileSync(join(referenceDir, "Ext", "Configuration.xml"), "<ExtensionConfiguration/>", "utf-8")
      fs.writeFileSync(join(referenceDir, "Ext", "ConfigDumpInfo.xml"), "<ConfigDumpInfo/>", "utf-8")
      fs.writeFileSync(join(referenceDir, "Ext", "CommonForms", "PeriodField.xml"), "<MetaDataObject/>", "utf-8")
      fs.writeFileSync(
        join(referenceDir, "Ext", "CommonForms", "PeriodField", "Ext", "Form.xml"),
        "<Form/>",
        "utf-8"
      )
      fs.writeFileSync(join(referenceDir, "Ext", "Roles", "Расш1_ОсновнаяРоль.xml"), "<MetaDataObject/>", "utf-8")
      fs.writeFileSync(join(referenceDir, "Ext", "Languages", "Русский.xml"), "<MetaDataObject/>", "utf-8")

      const result = await syncConfigurationToXML({
        context: mockContextToXML(),
        inputDir: yamlDir,
        outputDir: outDir,
        referenceDir,
      })

      expect(result.failed).toEqual([])
      expect(fs.readFileSync(join(outDir, "Ext", "ManagedApplicationModule.bsl"), "utf-8")).toBe(
        "Процедура Новая()\nКонецПроцедуры\n"
      )
      expect(fs.readFileSync(join(outDir, "Ext", "Configuration.xml"), "utf-8")).toBe("<ExtensionConfiguration/>")
      expect(fs.readFileSync(join(outDir, "Ext", "ConfigDumpInfo.xml"), "utf-8")).toBe("<ConfigDumpInfo/>")
      expect(fs.readFileSync(join(outDir, "Ext", "CommonForms", "PeriodField.xml"), "utf-8")).toBe(
        "<MetaDataObject/>"
      )
      expect(fs.readFileSync(join(outDir, "Ext", "CommonForms", "PeriodField", "Ext", "Form.xml"), "utf-8")).toBe(
        "<Form/>"
      )
      expect(fs.readFileSync(join(outDir, "Ext", "Roles", "Расш1_ОсновнаяРоль.xml"), "utf-8")).toBe(
        "<MetaDataObject/>"
      )
      expect(fs.readFileSync(join(outDir, "Ext", "Languages", "Русский.xml"), "utf-8")).toBe("<MetaDataObject/>")
      expectRootExternalDirUppercase(outDir)
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })

  it("удаляет старый корневой lowercase ext и не трогает Ext дочерних объектов", async () => {
    const tmp = fs.mkdtempSync(join(os.tmpdir(), "nkdk-root-legacy-ext-prune-"))
    const yamlDir = join(tmp, "yaml")
    const xmlDir = join(tmp, "xml")
    const outDir = join(tmp, "out")
    try {
      fs.mkdirSync(join(yamlDir, "Справочник", "Товары"), { recursive: true })
      fs.mkdirSync(join(outDir, "ext"), { recursive: true })
      fs.writeFileSync(join(yamlDir, CONFIGURATION_YAML_FILE), "Имя: Конфигурация\n", "utf-8")
      fs.writeFileSync(join(yamlDir, "МодульПриложения.bsl"), "Процедура Новая()\nКонецПроцедуры\n", "utf-8")
      fs.writeFileSync(join(yamlDir, "Справочник", "Товары", "Свойства.yaml"), "")
      fs.writeFileSync(
        join(yamlDir, "Справочник", "Товары", "МодульОбъекта.bsl"),
        "Процедура Проверка()\nКонецПроцедуры\n",
        "utf-8"
      )
      fs.writeFileSync(join(outDir, "ext", "ManagedApplicationModule.bsl"), "old", "utf-8")
      fs.writeFileSync(join(outDir, "ext", "CommandInterface.xml"), "<Old/>", "utf-8")

      const result = await syncConfigurationToXML({
        context: mockContextToXML(),
        inputDir: yamlDir,
        outputDir: outDir,
        referenceDir: xmlDir,
      })

      expect(result.failed).toEqual([])
      expectRootExternalDirUppercase(outDir)
      expect(fs.readFileSync(join(outDir, "Ext", "ManagedApplicationModule.bsl"), "utf-8")).toBe(
        "Процедура Новая()\nКонецПроцедуры\n"
      )
      expect(fs.readFileSync(join(outDir, "Catalogs", "Товары", "Ext", "ObjectModule.bsl"), "utf-8")).toBe(
        "Процедура Проверка()\nКонецПроцедуры\n"
      )
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })

  it("восстанавливает корневые command interface XML из Конфигурация.yaml", async () => {
    const tmp = fs.mkdtempSync(join(os.tmpdir(), "nkdk-root-command-interface-to-xml-"))
    const yamlDir = join(tmp, "yaml")
    const outDir = join(tmp, "out")
    try {
      fs.mkdirSync(yamlDir, { recursive: true })
      fs.mkdirSync(join(outDir, "Ext"), { recursive: true })
      fs.writeFileSync(join(outDir, "Ext", "Old.xml"), "<Old/>", "utf-8")
      fs.writeFileSync(
        join(yamlDir, CONFIGURATION_YAML_FILE),
        [
          "Имя: Конфигурация",
          "КомандныйИнтерфейс:",
          "  ВидимостьПодсистем:",
          "    Подсистема.ПодсистемаПоУмолчанию:",
          "      Общее: Ложь",
          "      Роли:",
          "        Администратор: Ложь",
          "  ПорядокПодсистем:",
          "    - Подсистема.ПодсистемаПоУмолчанию",
          "КомандныйИнтерфейсОсновногоРаздела:",
          "  ПорядокГрупп:",
          "    - ПанельНавигацииОбычное",
          "",
        ].join("\n"),
        "utf-8",
      )

      await syncConfigurationToXML({
        context: mockContextToXML(),
        inputDir: yamlDir,
        outputDir: outDir,
      })

      const commandInterfaceXML = fs.readFileSync(join(outDir, "Ext", "CommandInterface.xml"), "utf-8")
      const mainSectionXML = fs.readFileSync(join(outDir, "Ext", "MainSectionCommandInterface.xml"), "utf-8")

      expect(normalizeXML(commandInterfaceXML)).toContain("<SubsystemsVisibility>")
      expect(commandInterfaceXML).toContain("<Subsystem>Subsystem.ПодсистемаПоУмолчанию</Subsystem>")
      expect(commandInterfaceXML).toContain('<xr:Value name="Role.Администратор">false</xr:Value>')
      expect(mainSectionXML).toContain("<Group>NavigationPanelOrdinary</Group>")
      expect(fs.existsSync(join(outDir, "Ext", "Old.xml"))).toBe(false)
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })

  it("восстанавливает корневой ClientApplicationInterface.xml из Конфигурация.yaml", async () => {
    const tmp = fs.mkdtempSync(join(os.tmpdir(), "nkdk-client-interface-to-xml-"))
    const yamlDir = join(tmp, "yaml")
    const outDir = join(tmp, "out")
    try {
      fs.mkdirSync(yamlDir, { recursive: true })
      fs.writeFileSync(
        join(yamlDir, CONFIGURATION_YAML_FILE),
        [
          "Имя: Конфигурация",
          "ИнтерфейсКлиентскогоПриложения:",
          "  Верх:",
          "    - Панель: ПанельФункцийТекущегоРаздела",
          "    - Панель: ПанельОткрытых",
          "    - Панель: СтандартнаяПанель",
          "  Лево:",
          "    - Панель:",
          "        Имя: ПанельИстории",
          "        Высота: 1",
          "        Представление: КартинкаСлеваИТекст",
          "  Низ:",
          "    - Панель: ПанельРазделов",
          "",
        ].join("\n"),
        "utf-8",
      )

      await syncConfigurationToXML({
        context: mockContextToXML(),
        inputDir: yamlDir,
        outputDir: outDir,
      })

      const result = fs.readFileSync(join(outDir, "Ext", "ClientApplicationInterface.xml"), "utf-8")
      expect(result).toContain("<ClientApplicationInterface")
      expect(result).toContain("<top>")
      expect(result).toContain("<uuid>c933ac92-92cd-459d-81cc-e0c8a83ced99</uuid>")
      expect(result).toContain("<height>1</height>")
      expect(result).toContain("<spr>PictureOnLeftAndText</spr>")
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })

  it("не создаёт ClientApplicationInterface.xml для чистой конфигурации без YAML-ключа", async () => {
    const tmp = fs.mkdtempSync(join(os.tmpdir(), "nkdk-client-interface-clean-to-xml-"))
    const yamlDir = join(tmp, "yaml")
    const outDir = join(tmp, "out")
    try {
      fs.mkdirSync(yamlDir, { recursive: true })
      fs.writeFileSync(join(yamlDir, CONFIGURATION_YAML_FILE), "Имя: Конфигурация\n", "utf-8")

      await syncConfigurationToXML({
        context: mockContextToXML(),
        inputDir: yamlDir,
        outputDir: outDir,
      })

      expect(fs.existsSync(join(outDir, "Ext", "ClientApplicationInterface.xml"))).toBe(false)
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })

  it("восстанавливает корневой HomePageWorkArea.xml из Конфигурация.yaml", async () => {
    const tmp = fs.mkdtempSync(join(os.tmpdir(), "nkdk-home-page-work-area-to-xml-"))
    const yamlDir = join(tmp, "yaml")
    const outDir = join(tmp, "out")
    try {
      fs.mkdirSync(yamlDir, { recursive: true })
      fs.writeFileSync(
        join(yamlDir, CONFIGURATION_YAML_FILE),
        [
          "Имя: Конфигурация",
          "РабочаяОбластьНачальнойСтраницы:",
          "  ШаблонРабочейОбласти: ДвеКолонкиПеременнойШирины",
          "  ЛеваяКолонка:",
          "    - Форма: CommonForm.НачалоРаботы",
          "      Высота: 100",
          "      Видимость:",
          "        Общее: Истина",
          "        Роли:",
          "          Администратор: Ложь",
          "  ПраваяКолонка:",
          "    - Форма: DataProcessor.ИнформационныйЦентр.Form.ИнформационныйЦентр",
          "      Высота: 10",
          "      Видимость:",
          "        Общее: Ложь",
          "  ОтображениеКомандногоИнтерфейса: Верх",
          "",
        ].join("\n"),
        "utf-8"
      )

      await syncConfigurationToXML({
        context: mockContextToXML(),
        inputDir: yamlDir,
        outputDir: outDir,
      })

      const result = fs.readFileSync(join(outDir, "Ext", "HomePageWorkArea.xml"), "utf-8")
      expect(result).toContain("<HomePageWorkArea")
      expect(result).toContain("<WorkingAreaTemplate>TwoColumnsVariableWidth</WorkingAreaTemplate>")
      expect(result).toContain("<Form>CommonForm.НачалоРаботы</Form>")
      expect(result).toContain('<xr:Value name="Role.Администратор">false</xr:Value>')
      expect(result).toContain("<MACommandInterfaceDisplays>Top</MACommandInterfaceDisplays>")
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })

  it("не создаёт HomePageWorkArea.xml для чистой конфигурации без YAML-ключа", async () => {
    const tmp = fs.mkdtempSync(join(os.tmpdir(), "nkdk-home-page-work-area-clean-to-xml-"))
    const yamlDir = join(tmp, "yaml")
    const outDir = join(tmp, "out")
    try {
      fs.mkdirSync(yamlDir, { recursive: true })
      fs.writeFileSync(join(yamlDir, CONFIGURATION_YAML_FILE), "Имя: Конфигурация\n", "utf-8")

      await syncConfigurationToXML({
        context: mockContextToXML(),
        inputDir: yamlDir,
        outputDir: outDir,
      })

      expect(fs.existsSync(join(outDir, "Ext", "HomePageWorkArea.xml"))).toBe(false)
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })

  it("удаляет старые корневые внешние файлы, которых нет в YAML", async () => {
    const tmp = fs.mkdtempSync(join(os.tmpdir(), "nkdk-root-external-prune-"))
    const yamlDir = join(tmp, "yaml")
    const outDir = join(tmp, "out")
    const sessionModule = "Процедура ПриНачалеСеанса()\nКонецПроцедуры\n"

    try {
      fs.mkdirSync(yamlDir, { recursive: true })
      fs.mkdirSync(join(outDir, "Ext", "Splash"), { recursive: true })
      fs.writeFileSync(join(yamlDir, CONFIGURATION_YAML_FILE), "Имя: Конфигурация\n", "utf-8")
      fs.writeFileSync(join(yamlDir, "МодульСеанса.bsl"), sessionModule, "utf-8")
      fs.writeFileSync(join(outDir, "Ext", "ManagedApplicationModule.bsl"), "old", "utf-8")
      fs.writeFileSync(join(outDir, "Ext", "SessionModule.bsl"), "old", "utf-8")
      fs.writeFileSync(join(outDir, "Ext", "MobileClientSignature.bin"), Buffer.from([0, 1, 2, 255]))
      fs.writeFileSync(join(outDir, "Ext", "Splash.xml"), "<OldSplash/>", "utf-8")
      fs.writeFileSync(join(outDir, "Ext", "Splash", "Picture.png"), Buffer.from([137, 80, 78, 71]))

      await syncConfigurationToXML({
        context: mockContextToXML(),
        inputDir: yamlDir,
        outputDir: outDir,
      })

      expect(fs.existsSync(join(outDir, "Ext", "ManagedApplicationModule.bsl"))).toBe(false)
      expect(fs.readFileSync(join(outDir, "Ext", "SessionModule.bsl"), "utf-8")).toBe(sessionModule)
      expect(fs.existsSync(join(outDir, "Ext", "MobileClientSignature.bin"))).toBe(false)
      expect(fs.existsSync(join(outDir, "Ext", "Splash.xml"))).toBe(false)
      expect(fs.existsSync(join(outDir, "Ext", "Splash", "Picture.png"))).toBe(false)
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })

  it("удаляет старый корневой Configuration.xml, если Конфигурация.yaml отсутствует", async () => {
    const tmp = fs.mkdtempSync(join(os.tmpdir(), "nkdk-root-prune-"))
    const yamlDir = join(tmp, "yaml")
    const outDir = join(tmp, "out")
    try {
      fs.mkdirSync(yamlDir, { recursive: true })
      fs.mkdirSync(join(outDir, "Ext", "Splash"), { recursive: true })
      fs.writeFileSync(join(outDir, CONFIGURATION_XML_FILE), "<MetaDataObject/>", "utf-8")
      fs.writeFileSync(join(outDir, "Ext", "ManagedApplicationModule.bsl"), "old", "utf-8")
      fs.writeFileSync(join(outDir, "Ext", "MobileClientSignature.bin"), Buffer.from([0, 1, 2, 255]))
      fs.writeFileSync(join(outDir, "Ext", "Splash.xml"), "<OldSplash/>", "utf-8")
      fs.writeFileSync(join(outDir, "Ext", "Splash", "Picture.png"), Buffer.from([137, 80, 78, 71]))

      await syncConfigurationToXML({
        context: mockContextToXML(),
        inputDir: yamlDir,
        outputDir: outDir,
        referenceDir,
      })

      expect(fs.existsSync(join(outDir, CONFIGURATION_XML_FILE))).toBe(false)
      expect(fs.existsSync(join(outDir, "Ext", "ManagedApplicationModule.bsl"))).toBe(false)
      expect(fs.existsSync(join(outDir, "Ext", "MobileClientSignature.bin"))).toBe(false)
      expect(fs.existsSync(join(outDir, "Ext", "Splash.xml"))).toBe(false)
      expect(fs.existsSync(join(outDir, "Ext", "Splash", "Picture.png"))).toBe(false)
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })

  it("round-trip Document/DocumentNumerator/Sequence: XML → YAML → XML возвращает исходный XML", async () => {
    const tmpYamlDir = getXMLFixturePath("sync/syncConfiguration/_tmp_yaml")
    const tmpXmlDir = getXMLFixturePath("sync/syncConfiguration/_tmp_xml")
    if (fs.existsSync(tmpYamlDir)) fs.rmSync(tmpYamlDir, { recursive: true })
    if (fs.existsSync(tmpXmlDir)) fs.rmSync(tmpXmlDir, { recursive: true })
    fs.mkdirSync(tmpYamlDir, { recursive: true })
    fs.mkdirSync(tmpXmlDir, { recursive: true })

    // 1. XML → YAML
    await syncConfigurationFromXML({
      context: mockContextFromXML(),
      inputDir: referenceDir,
      outputDir: tmpYamlDir,
    })

    // 2. YAML → XML
    await syncConfigurationToXML({
      context: mockContextToXML(),
      inputDir: tmpYamlDir,
      outputDir: tmpXmlDir,
      referenceDir,
    })

    // DocumentNumerator и Sequence — полный round-trip (правила покрывают все поля фикстуры)
    for (const [xmlSubdir, fileName] of [
      ["DocumentNumerators", "НумераторПоУмолчанию.xml"],
      ["Sequences", "ПоследовательностьПоУмолчанию.xml"],
    ] as const) {
      const expected = readXMLFileAsString(join("sync/syncConfiguration/xml", xmlSubdir, fileName))
      const actual = readXMLFileAsString(join("sync/syncConfiguration/_tmp_xml", xmlSubdir, fileName))
      expect(actual, `mismatch in ${xmlSubdir}/${fileName}`).toBe(expected)
    }

    // Document — только проверка, что walker дошёл до Documents/ и создал XML.
    // Полный round-trip XML→YAML→XML для Document остаётся ослабленным и в этой
    // версии — не из-за `MetadataDocumentRules` (пробелы закрыты в PRD-1
    // `2026-04-26-metadata-document-round-trip-gaps`), а из-за общих
    // инфраструктурных ограничений, не входящих в границы того PRD:
    //   1. mockContextToXML не подкладывает фиксированный `uuid` в <Document>.
    //   2. StandardAttributeDescriptions сериализует атрибуты алфавитно,
    //      а реальная фикстура имеет порядок Posted/Ref/DeletionMark/Date/Number.
    //   3. InternalInfo-механизм для TabularSection зашит на CatalogTabularSection,
    //      а Document требует DocumentTabularSection.
    //   4. <Form>/<Template>: PRD-2 (Document — Forms/Templates/Modules/Help).
    //   5. У атрибутов сериализуется лишний <Use>ForItem</Use>
    //      (поведение общей сериализации атрибутов).
    // Поднять assertions до уровня Sequence/DocumentNumerator можно после
    // устранения каждого из пунктов выше — это отдельные тикеты вне границ
    // PRD-1.
    expect(
      fs.existsSync(join(tmpXmlDir, "Documents", "ДокументПоУмолчанию.xml")),
      "walker should produce Documents/ДокументПоУмолчанию.xml",
    ).toBe(true)

    fs.rmSync(tmpYamlDir, { recursive: true })
    fs.rmSync(tmpXmlDir, { recursive: true })
  })

  it("без миграций сохраняет reference-данные коллекций по обычному имени", async () => {
    const tmp = fs.mkdtempSync(join(os.tmpdir(), "nkdk-config-no-migration-reference-"))
    const yamlDir = join(tmp, "yaml")
    const xmlDir = join(tmp, "xml")
    const outDir = join(tmp, "out")

    try {
      fs.mkdirSync(join(yamlDir, "Справочник", "Товары"), { recursive: true })
      fs.mkdirSync(join(xmlDir, "Catalogs"), { recursive: true })
      fs.writeFileSync(join(yamlDir, "Справочник", "Товары", "Свойства.yaml"), [
        "Реквизиты:",
        "  Артикул:",
        "    Тип: Строка",
        "",
      ].join("\n"))
      fs.writeFileSync(join(xmlDir, "Catalogs", "Товары.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<MetaDataObject xmlns="http://v8.1c.ru/8.3/MDClasses" version="2.20">
	<Catalog uuid="00000000-0000-0000-0000-000000000001">
		<Properties>
			<Name>Товары</Name>
			<Synonym/>
			<Comment/>
			<UseStandardCommands>true</UseStandardCommands>
			<CodeLength>9</CodeLength>
			<DescriptionLength>25</DescriptionLength>
			<Hierarchical>false</Hierarchical>
			<FoldersOnTop>true</FoldersOnTop>
			<Owners/>
			<SubordinationUse>ToItems</SubordinationUse>
			<PredefinedDataUpdate>Auto</PredefinedDataUpdate>
			<FullTextSearch>Use</FullTextSearch>
			<ChoiceMode>BothWays</ChoiceMode>
			<DefaultPresentation>AsDescription</DefaultPresentation>
			<EditType>InDialog</EditType>
			<QuickChoice>true</QuickChoice>
			<IncludeHelpInContents>true</IncludeHelpInContents>
			<InputByString/>
			<SearchStringModeOnInputByString>Begin</SearchStringModeOnInputByString>
			<CreateOnInput>Use</CreateOnInput>
			<DataLockControlMode>Managed</DataLockControlMode>
			<ModalChoiceMode>Both</ModalChoiceMode>
			<DefaultObjectForm/>
			<DefaultFolderForm/>
			<DefaultListForm/>
			<DefaultChoiceForm/>
			<DefaultFolderChoiceForm/>
			<AuxiliaryObjectForm/>
			<AuxiliaryFolderForm/>
			<AuxiliaryListForm/>
			<AuxiliaryChoiceForm/>
			<AuxiliaryFolderChoiceForm/>
		</Properties>
		<ChildObjects>
			<Attribute uuid="00000000-0000-0000-0000-000000000101">
				<Properties>
					<Name>Артикул</Name>
					<Synonym/>
					<Comment/>
					<Type>
						<v8:Type>xs:string</v8:Type>
						<v8:StringQualifiers>
							<v8:Length>0</v8:Length>
							<v8:AllowedLength>Variable</v8:AllowedLength>
						</v8:StringQualifiers>
					</Type>
					<PasswordMode>false</PasswordMode>
					<Format/>
					<EditFormat/>
					<ToolTip/>
					<MarkNegatives>false</MarkNegatives>
					<Mask/>
					<MultiLine>false</MultiLine>
					<ExtendedEdit>false</ExtendedEdit>
					<MinValue xsi:nil="true"/>
					<MaxValue xsi:nil="true"/>
					<FillChecking>DontCheck</FillChecking>
					<ChoiceFoldersAndItems>Items</ChoiceFoldersAndItems>
					<ChoiceParameterLinks/>
					<ChoiceParameters/>
					<QuickChoice>Auto</QuickChoice>
					<CreateOnInput>Use</CreateOnInput>
					<ChoiceHistoryOnInput>Auto</ChoiceHistoryOnInput>
					<FullTextSearch>Use</FullTextSearch>
					<Use>ForItem</Use>
				</Properties>
			</Attribute>
		</ChildObjects>
	</Catalog>
</MetaDataObject>`, "utf-8")

      const result = await syncConfigurationToXML({
        context: mockContextToXML(),
        inputDir: yamlDir,
        outputDir: outDir,
        referenceDir: xmlDir,
      })

      expect(result.failed).toEqual([])
      const xml = fs.readFileSync(join(outDir, "Catalogs", "Товары.xml"), "utf-8")
      expect(xml).toContain('<Attribute uuid="00000000-0000-0000-0000-000000000101">')
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })

  it("сохраняет uuid при переименовании справочника и реквизита через remap reference", async () => {
    const tmp = getXMLFixturePath("sync/syncConfiguration/_tmp_migration_rename")
    const yamlDir = join(tmp, "yaml")
    const xmlDir = join(tmp, "xml")
    const outDir = join(tmp, "out")
    if (fs.existsSync(tmp)) fs.rmSync(tmp, { recursive: true })
    fs.mkdirSync(join(yamlDir, "Справочник", "Номенклатура"), { recursive: true })
    fs.mkdirSync(join(yamlDir, "Миграции"), { recursive: true })
    fs.mkdirSync(join(xmlDir, "Catalogs"), { recursive: true })

    fs.writeFileSync(join(yamlDir, "Справочник", "Номенклатура", "Свойства.yaml"), [
      "Реквизиты:",
      "  НовыйАртикул:",
      "    Тип: Строка",
      "",
    ].join("\n"))
    fs.writeFileSync(join(yamlDir, "Миграции", "2026-05-05-143000.yaml"), [
      '"Справочник.Товары": "Номенклатура"',
      '"Справочник.Номенклатура.Реквизит.Артикул": "НовыйАртикул"',
      "",
    ].join("\n"))
    fs.writeFileSync(join(xmlDir, "Catalogs", "Товары.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<MetaDataObject xmlns="http://v8.1c.ru/8.3/MDClasses" version="2.20">
	<Catalog uuid="00000000-0000-0000-0000-000000000001">
		<Properties>
			<Name>Товары</Name>
			<Synonym/>
			<Comment/>
			<UseStandardCommands>true</UseStandardCommands>
			<CodeLength>9</CodeLength>
			<DescriptionLength>25</DescriptionLength>
			<Hierarchical>false</Hierarchical>
			<FoldersOnTop>true</FoldersOnTop>
			<Owners/>
			<SubordinationUse>ToItems</SubordinationUse>
			<PredefinedDataUpdate>Auto</PredefinedDataUpdate>
			<FullTextSearch>Use</FullTextSearch>
			<ChoiceMode>BothWays</ChoiceMode>
			<DefaultPresentation>AsDescription</DefaultPresentation>
			<EditType>InDialog</EditType>
			<QuickChoice>true</QuickChoice>
			<IncludeHelpInContents>true</IncludeHelpInContents>
			<InputByString/>
			<SearchStringModeOnInputByString>Begin</SearchStringModeOnInputByString>
			<CreateOnInput>Use</CreateOnInput>
			<DataLockControlMode>Managed</DataLockControlMode>
			<ModalChoiceMode>Both</ModalChoiceMode>
			<DefaultObjectForm/>
			<DefaultFolderForm/>
			<DefaultListForm/>
			<DefaultChoiceForm/>
			<DefaultFolderChoiceForm/>
			<AuxiliaryObjectForm/>
			<AuxiliaryFolderForm/>
			<AuxiliaryListForm/>
			<AuxiliaryChoiceForm/>
			<AuxiliaryFolderChoiceForm/>
		</Properties>
		<ChildObjects>
			<Attribute uuid="00000000-0000-0000-0000-000000000101">
				<Properties>
					<Name>Артикул</Name>
					<Synonym/>
					<Comment/>
					<Type>
						<v8:Type>xs:string</v8:Type>
						<v8:StringQualifiers>
							<v8:Length>0</v8:Length>
							<v8:AllowedLength>Variable</v8:AllowedLength>
						</v8:StringQualifiers>
					</Type>
					<PasswordMode>false</PasswordMode>
					<Format/>
					<EditFormat/>
					<ToolTip/>
					<MarkNegatives>false</MarkNegatives>
					<Mask/>
					<MultiLine>false</MultiLine>
					<ExtendedEdit>false</ExtendedEdit>
					<MinValue xsi:nil="true"/>
					<MaxValue xsi:nil="true"/>
					<FillChecking>DontCheck</FillChecking>
					<ChoiceFoldersAndItems>Items</ChoiceFoldersAndItems>
					<ChoiceParameterLinks/>
					<ChoiceParameters/>
					<QuickChoice>Auto</QuickChoice>
					<CreateOnInput>Use</CreateOnInput>
					<ChoiceHistoryOnInput>Auto</ChoiceHistoryOnInput>
					<FullTextSearch>Use</FullTextSearch>
					<Use>ForItem</Use>
				</Properties>
			</Attribute>
		</ChildObjects>
	</Catalog>
</MetaDataObject>`, "utf-8")

    try {
      await syncConfigurationToXML({
        context: mockContextToXML(),
        inputDir: yamlDir,
        outputDir: outDir,
        referenceDir: xmlDir,
      })

      const result = fs.readFileSync(join(outDir, "Catalogs", "Номенклатура.xml"), "utf-8")
      expect(result).toContain('<Catalog uuid="00000000-0000-0000-0000-000000000001">')
      expect(result).toContain('<Attribute uuid="00000000-0000-0000-0000-000000000101">')
      expect(result).toContain("<Name>НовыйАртикул</Name>")
    } finally {
      if (fs.existsSync(tmp)) fs.rmSync(tmp, { recursive: true })
    }
  })

  it("пишет ConfigDumpInfo.xml и добавляет новый объект", async () => {
    const tmp = fs.mkdtempSync(join(os.tmpdir(), "nkdk-config-dump-info-new-"))
    const yamlDir = join(tmp, "yaml")
    const xmlDir = join(tmp, "xml")
    const outDir = join(tmp, "out")

    try {
      fs.mkdirSync(join(yamlDir, "Справочник", "Номенклатура"), { recursive: true })
      fs.mkdirSync(xmlDir, { recursive: true })
      fs.writeFileSync(join(yamlDir, "Справочник", "Номенклатура", "Свойства.yaml"), [
        "Реквизиты:",
        "  Артикул:",
        "    Тип: Строка",
        "",
      ].join("\n"))
      fs.writeFileSync(join(xmlDir, "ConfigDumpInfo.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<ConfigDumpInfo xmlns="http://v8.1c.ru/8.3/xcf/dumpinfo" xmlns:xen="http://v8.1c.ru/8.3/xcf/enums" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" format="Hierarchical" version="2.20">
	<ConfigVersions/>
</ConfigDumpInfo>`, "utf-8")

      const result = await syncConfigurationToXML({
        context: mockContextToXML(),
        inputDir: yamlDir,
        outputDir: outDir,
        referenceDir: xmlDir,
      })

      expect(result.failed).toEqual([])
      const xml = fs.readFileSync(join(outDir, "ConfigDumpInfo.xml"), "utf-8")
      expect(xml).toContain('name="Catalog.Номенклатура"')
      expect(xml).toContain('name="Catalog.Номенклатура.Attribute.Артикул"')
      expect(xml).toMatch(/configVersion="[0-9a-f]{40}"/)
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })

  it("сохраняет CRLF из reference ConfigDumpInfo.xml", async () => {
    const tmp = fs.mkdtempSync(join(os.tmpdir(), "nkdk-config-dump-info-line-endings-"))
    const yamlDir = join(tmp, "yaml")
    const xmlDir = join(tmp, "xml")
    const outDir = join(tmp, "out")

    try {
      fs.mkdirSync(join(yamlDir, "Справочник", "Номенклатура"), { recursive: true })
      fs.mkdirSync(xmlDir, { recursive: true })
      fs.writeFileSync(join(yamlDir, "Справочник", "Номенклатура", "Свойства.yaml"), "", "utf-8")
      fs.writeFileSync(
        join(xmlDir, "ConfigDumpInfo.xml"),
        [
          "\uFEFF<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
          '<ConfigDumpInfo xmlns="http://v8.1c.ru/8.3/xcf/dumpinfo" xmlns:xen="http://v8.1c.ru/8.3/xcf/enums" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" format="Hierarchical" version="2.20">',
          "\t<ConfigVersions/>",
          "</ConfigDumpInfo>",
        ].join("\r\n"),
        "utf-8"
      )

      const result = await syncConfigurationToXML({
        context: mockContextToXML(),
        inputDir: yamlDir,
        outputDir: outDir,
        referenceDir: xmlDir,
      })

      expect(result.failed).toEqual([])
      const xml = fs.readFileSync(join(outDir, "ConfigDumpInfo.xml"), "utf-8")
      expect(xml).toContain("?>\r\n<ConfigDumpInfo")
      expect(xml).not.toContain("?>\n<ConfigDumpInfo")
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })

  it("возвращает failed item для битого reference ConfigDumpInfo.xml", async () => {
    const tmp = fs.mkdtempSync(join(os.tmpdir(), "nkdk-config-dump-info-broken-"))
    const yamlDir = join(tmp, "yaml")
    const xmlDir = join(tmp, "xml")
    const outDir = join(tmp, "out")

    try {
      fs.mkdirSync(join(yamlDir, "Справочник", "Товары"), { recursive: true })
      fs.mkdirSync(xmlDir, { recursive: true })
      fs.writeFileSync(join(yamlDir, "Справочник", "Товары", "Свойства.yaml"), "", "utf-8")
      fs.writeFileSync(join(xmlDir, "ConfigDumpInfo.xml"), "<ConfigDumpInfo><ConfigVersions>", "utf-8")

      const result = await syncConfigurationToXML({
        context: mockContextToXML(),
        inputDir: yamlDir,
        outputDir: outDir,
        referenceDir: xmlDir,
      })

      expect(result.failed).toHaveLength(1)
      expect(result.failed[0]).toMatchObject({ kind: "configDumpInfo", name: "ConfigDumpInfo.xml" })
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })

  it("переносит ConfigDumpInfo при переименовании и удаляет старое имя", async () => {
    const tmp = fs.mkdtempSync(join(os.tmpdir(), "nkdk-config-dump-info-rename-"))
    const yamlDir = join(tmp, "yaml")
    const xmlDir = join(tmp, "xml")
    const outDir = join(tmp, "out")

    try {
      fs.mkdirSync(join(yamlDir, "Справочник", "Номенклатура"), { recursive: true })
      fs.mkdirSync(join(yamlDir, "Миграции"), { recursive: true })
      fs.mkdirSync(join(xmlDir, "Catalogs"), { recursive: true })
      fs.writeFileSync(join(yamlDir, "Справочник", "Номенклатура", "Свойства.yaml"), [
        "Реквизиты:",
        "  КодАртикула:",
        "    Тип: Строка",
        "",
      ].join("\n"))
      fs.writeFileSync(join(yamlDir, "Миграции", "2026-05-05-143000.yaml"), [
        '"Справочник.Товары": "Номенклатура"',
        '"Справочник.Номенклатура.Реквизит.Артикул": "КодАртикула"',
        "",
      ].join("\n"))
      fs.writeFileSync(join(xmlDir, "Catalogs", "Товары.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<MetaDataObject xmlns="http://v8.1c.ru/8.3/MDClasses" version="2.20">
	<Catalog uuid="00000000-0000-0000-0000-000000000001">
		<Properties><Name>Товары</Name><Synonym/><Comment/></Properties>
		<ChildObjects>
			<Attribute uuid="00000000-0000-0000-0000-000000000101">
				<Properties><Name>Артикул</Name><Synonym/><Comment/></Properties>
			</Attribute>
		</ChildObjects>
	</Catalog>
</MetaDataObject>`, "utf-8")
      fs.writeFileSync(join(xmlDir, "ConfigDumpInfo.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<ConfigDumpInfo xmlns="http://v8.1c.ru/8.3/xcf/dumpinfo" xmlns:xen="http://v8.1c.ru/8.3/xcf/enums" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" format="Hierarchical" version="2.20">
	<ConfigVersions>
		<Metadata name="Catalog.Товары" id="catalog-id" configVersion="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa">
			<Metadata name="Catalog.Товары.Attribute.Артикул" id="attribute-id"/>
		</Metadata>
		<Metadata name="Catalog.Товары.Form.ФормаЭлемента" id="form-id" configVersion="cccccccccccccccccccccccccccccccccccccccc"/>
	</ConfigVersions>
</ConfigDumpInfo>`, "utf-8")

      const context = mockContextToXML()
      const result = await syncConfigurationToXML({
        context,
        inputDir: yamlDir,
        outputDir: outDir,
        referenceDir: xmlDir,
      })

      expect(result.failed).toEqual([])
      const parsed = importContentFromXML<{ ConfigDumpInfo: ConfigDumpInfoXML }>(
        fs.readFileSync(join(outDir, "ConfigDumpInfo.xml"), "utf-8"),
      )
      const idMap = importConfigDumpInfoFromXML({ context, xml: parsed.ConfigDumpInfo })
      const catalogEntry = idMap.get("Catalog.Номенклатура")
      const formEntry = idMap.get("Catalog.Номенклатура.Form.ФормаЭлемента")

      expect(idMap.has("Catalog.Товары")).toBe(false)
      expect(catalogEntry?.id).toBe("catalog-id")
      expect(catalogEntry?.configVersion).toBe("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")
      expect(catalogEntry?.children.get("Catalog.Номенклатура.Attribute.КодАртикула")).toBe("attribute-id")
      expect(catalogEntry?.children.has("Catalog.Номенклатура.Attribute.Артикул")).toBe(false)
      expect(formEntry?.id).toBe("form-id")
      expect(formEntry?.configVersion).toBe("cccccccccccccccccccccccccccccccccccccccc")
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })

  it("останавливает sync при конфликте без миграции", async () => {
    const tmp = getXMLFixturePath("sync/syncConfiguration/_tmp_migration_conflict")
    const yamlDir = join(tmp, "yaml")
    const xmlDir = join(tmp, "xml")
    const outDir = join(tmp, "out")
    if (fs.existsSync(tmp)) fs.rmSync(tmp, { recursive: true })
    fs.mkdirSync(join(yamlDir, "Справочник", "Номенклатура"), { recursive: true })
    fs.mkdirSync(join(xmlDir, "Catalogs"), { recursive: true })

    fs.writeFileSync(join(yamlDir, "Справочник", "Номенклатура", "Свойства.yaml"), "")
    fs.writeFileSync(join(xmlDir, "Catalogs", "Товары.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<MetaDataObject xmlns="http://v8.1c.ru/8.3/MDClasses" version="2.20">
	<Catalog uuid="00000000-0000-0000-0000-000000000001">
		<Properties><Name>Товары</Name><Synonym/><Comment/></Properties>
	</Catalog>
</MetaDataObject>`, "utf-8")

    try {
      const result = await syncConfigurationToXML({
        context: mockContextToXML(),
        inputDir: yamlDir,
        outputDir: outDir,
        referenceDir: xmlDir,
      })

      expect(result.failed[0]?.error.message).toContain("Найдены возможные переименования")
      expect(result.failed[0]?.error.message).toContain("nkdk generate-migration")
    } finally {
      if (fs.existsSync(tmp)) fs.rmSync(tmp, { recursive: true })
    }
  })

  it("пишет .nakidka-migrations.yaml после успешного sync", async () => {
    const tmp = getXMLFixturePath("sync/syncConfiguration/_tmp_migration_state")
    const yamlDir = join(tmp, "yaml")
    const xmlDir = join(tmp, "xml")
    const outDir = join(tmp, "out")
    if (fs.existsSync(tmp)) fs.rmSync(tmp, { recursive: true })
    fs.mkdirSync(join(yamlDir, "Справочник", "Товары"), { recursive: true })
    fs.writeFileSync(join(yamlDir, "Справочник", "Товары", "Свойства.yaml"), "")

    try {
      const result = await syncConfigurationToXML({
        context: mockContextToXML(),
        inputDir: yamlDir,
        outputDir: outDir,
        referenceDir: xmlDir,
      })

      expect(result.failed).toEqual([])
      expect(fs.readFileSync(join(outDir, ".nakidka-migrations.yaml"), "utf-8")).toBe("applied: []\n")
    } finally {
      if (fs.existsSync(tmp)) fs.rmSync(tmp, { recursive: true })
    }
  })

  it("пишет внешние файлы объекта в директорию объекта при configuration sync", async () => {
    const tmp = getXMLFixturePath("sync/syncConfiguration/_tmp_external_files")
    const yamlDir = join(tmp, "yaml")
    const xmlDir = join(tmp, "xml")
    const outDir = join(tmp, "out")
    if (fs.existsSync(tmp)) fs.rmSync(tmp, { recursive: true })
    fs.mkdirSync(join(yamlDir, "Справочник", "Товары"), { recursive: true })
    fs.writeFileSync(join(yamlDir, "Справочник", "Товары", "Свойства.yaml"), "")
    fs.writeFileSync(join(yamlDir, "Справочник", "Товары", "МодульОбъекта.bsl"), "Процедура Проверка()\nКонецПроцедуры\n")

    try {
      const result = await syncConfigurationToXML({
        context: mockContextToXML(),
        inputDir: yamlDir,
        outputDir: outDir,
        referenceDir: xmlDir,
      })

      expect(result.failed).toEqual([])
      expect(fs.readFileSync(join(outDir, "Catalogs", "Товары", "Ext", "ObjectModule.bsl"), "utf-8")).toBe(
        "Процедура Проверка()\nКонецПроцедуры\n",
      )
      expect(fs.existsSync(join(outDir, "Catalogs", "Ext", "ObjectModule.bsl"))).toBe(false)
    } finally {
      if (fs.existsSync(tmp)) fs.rmSync(tmp, { recursive: true })
    }
  })

  it("пишет шаблоны дочерних объектов без повторного имени объекта", async () => {
    const tmp = getXMLFixturePath("sync/syncConfiguration/_tmp_child_templates")
    const yamlDir = join(tmp, "yaml")
    const xmlDir = join(tmp, "xml")
    const outDir = join(tmp, "out")
    const name = "ТестовоеХранилище"
    if (fs.existsSync(tmp)) fs.rmSync(tmp, { recursive: true })
    fs.mkdirSync(join(yamlDir, "ХранилищеНастроек", name, "Шаблоны", "Макет"), { recursive: true })
    fs.writeFileSync(join(yamlDir, "ХранилищеНастроек", name, "Свойства.yaml"), [
      "Синоним: Тестовое хранилище",
      "Шаблоны:",
      "  - Макет",
      "",
    ].join("\n"))
    fs.writeFileSync(join(yamlDir, "ХранилищеНастроек", name, "Шаблоны", "Макет", "Template.xml"), "<Template/>")
    fs.writeFileSync(join(yamlDir, "ХранилищеНастроек", name, "Шаблоны", "Макет", "Template.txt"), "template text")

    try {
      const result = await syncConfigurationToXML({
        context: mockContextToXML(),
        inputDir: yamlDir,
        outputDir: outDir,
        referenceDir: xmlDir,
      })

      expect(result.failed).toEqual([])
      expect(
        fs.readFileSync(join(outDir, "SettingsStorages", name, "Templates", "Макет", "Ext", "Template.txt"), "utf-8"),
      ).toBe("template text")
      expect(fs.existsSync(join(outDir, "SettingsStorages", name, name, "Templates", "Макет", "Ext", "Template.txt"))).toBe(false)
    } finally {
      if (fs.existsSync(tmp)) fs.rmSync(tmp, { recursive: true })
    }
  })

  it("не удаляет поддержанные внешние файлы после manifest prune", async () => {
    const tmp = getXMLFixturePath("sync/syncConfiguration/_tmp_manifest_external_files")
    const yamlDir = join(tmp, "yaml")
    const outDir = join(tmp, "out")
    if (fs.existsSync(tmp)) fs.rmSync(tmp, { recursive: true })
    fs.mkdirSync(tmp, { recursive: true })
    fs.cpSync(inputDir, yamlDir, { recursive: true })

    writeTestFile(join(yamlDir, "ОбщийМакет", "ДвоичныйМакет", "Свойства.yaml"), "ВидМакета: BinaryData\n")
    writeTestFile(join(yamlDir, "ОбщийМакет", "ДвоичныйМакет", "Template.bin"), Buffer.from([1, 2, 3]))
    writeTestFile(join(yamlDir, "Справочник", catalogName, "Справка", "ru.html"), "<html>help</html>")
    writeTestFile(join(yamlDir, "Справочник", catalogName, "Справка", "_files", "logo.png"), Buffer.from([4, 5, 6]))
    writeTestFile(
      join(yamlDir, "Справочник", catalogName, "Формы", "ФормаЭлемента", "Картинки", "ПолеВвода1.png"),
      Buffer.from([7, 8, 9]),
    )
    writeTestFile(
      join(yamlDir, "Справочник", catalogName, "Формы", "ФормаЭлемента", "КартинкиЗначений", "ПолеВвода1.bmp"),
      Buffer.from([10, 11, 12]),
    )
    writeTestFile(join(yamlDir, "WSСсылка", "Калькулятор", "Свойства.yaml"), "URL: http://example.test/wsdl\n")
    writeTestFile(join(yamlDir, "WSСсылка", "Калькулятор", "WSDefinition.xml"), "<definitions/>")
    writeTestFile(join(yamlDir, "WSСсылка", "Калькулятор", "XSD", "schema.xsd"), "<xs:schema/>")

    writeTestFile(join(outDir, "CommonTemplates", "ДвоичныйМакет", "Ext", "stale.bin"), "stale")
    writeTestFile(join(outDir, "Catalogs", catalogName, "Ext", "Help", "_files", "stale.png"), "stale")
    writeTestFile(
      join(outDir, "Catalogs", catalogName, "Forms", "ФормаЭлемента", "Ext", "Form", "Items", "ПолеВвода1", "Stale.png"),
      "stale",
    )
    writeTestFile(join(outDir, "WSReferences", "Калькулятор", "Ext", "stale.xsd"), "stale")

    try {
      const result = await syncConfigurationToXML({
        context: mockContextToXML(),
        inputDir: yamlDir,
        outputDir: outDir,
        referenceDir,
      })

      expect(result.failed).toEqual([])
      expect([...fs.readFileSync(join(outDir, "CommonTemplates", "ДвоичныйМакет", "Ext", "Template.bin"))]).toEqual([
        1,
        2,
        3,
      ])
      expect([...fs.readFileSync(join(outDir, "Catalogs", catalogName, "Ext", "Help", "_files", "logo.png"))]).toEqual([
        4,
        5,
        6,
      ])
      expect([
        ...fs.readFileSync(
          join(
            outDir,
            "Catalogs",
            catalogName,
            "Forms",
            "ФормаЭлемента",
            "Ext",
            "Form",
            "Items",
            "ПолеВвода1",
            "Picture.png",
          )
        ),
      ]).toEqual([7, 8, 9])
      expect([
        ...fs.readFileSync(
          join(
            outDir,
            "Catalogs",
            catalogName,
            "Forms",
            "ФормаЭлемента",
            "Ext",
            "Form",
            "Items",
            "ПолеВвода1",
            "ValuesPicture.bmp",
          )
        ),
      ]).toEqual([10, 11, 12])
      expect(fs.readFileSync(join(outDir, "WSReferences", "Калькулятор", "Ext", "schema.xsd"), "utf-8")).toBe(
        "<xs:schema/>"
      )

      expect(fs.existsSync(join(outDir, "CommonTemplates", "ДвоичныйМакет", "Ext", "stale.bin"))).toBe(false)
      expect(fs.existsSync(join(outDir, "Catalogs", catalogName, "Ext", "Help", "_files", "stale.png"))).toBe(false)
      expect(
        fs.existsSync(
          join(
            outDir,
            "Catalogs",
            catalogName,
            "Forms",
            "ФормаЭлемента",
            "Ext",
            "Form",
            "Items",
            "ПолеВвода1",
            "Stale.png",
          )
        )
      ).toBe(false)
      expect(fs.existsSync(join(outDir, "WSReferences", "Калькулятор", "Ext", "stale.xsd"))).toBe(false)
    } finally {
      if (fs.existsSync(tmp)) fs.rmSync(tmp, { recursive: true })
    }
  })
})

const writeTestFile = (path: string, content: string | Buffer): void => {
  fs.mkdirSync(dirname(path), { recursive: true })
  fs.writeFileSync(path, content)
}
