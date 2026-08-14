import fs from "fs"
import os from "os"
import { join } from "path"
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"
import { mockContextFromXML } from "../../../tests/mockContext"
import { readXMLFileAsString } from "../../../tests/readAndParseXMLFile"
import {
  createImportProjectStateTestService,
  createXmlImportWorkerTestPool,
} from "../../../tests/xmlImportWorkerTestPool"
import {
  type ConfigurationIndexBlockEntity,
  type ConfigurationProjectFile,
} from "../../configurationIndex"
import { configurationIndexStoreDescriptor, openConfigurationIndexStore } from "../../configurationIndex/store"
import { syncConfigurationFromXML } from "./convertFromXML"
import { CONFIGURATION_XML_FILE, CONFIGURATION_YAML_FILE } from "./rootIO"

describe("sync configuration from xml", () => {
  const sourceInputDir = join(__dirname, "__fixtures__/syncConfiguration/xml")
  const inputDir = join(__dirname, "__fixtures__/_import_xml_tmp")
  const projectDir = join(__dirname, "__fixtures__/_import_project_tmp")
  const outputDir = join(projectDir, "cf")
  const rootCommandInterfaceFixturesDir = join(__dirname, "../../commonObjects/rootCommandInterface/__fixtures__")
  const clientApplicationInterfaceFixturesDir = join(
    __dirname,
    "../../commonObjects/clientApplicationInterface/__fixtures__"
  )
  const xmlImportWorkerPoolHandle = createXmlImportWorkerTestPool()
  const projectState = createImportProjectStateTestService()
  const syncConfigurationFromXMLForTest = (
    params: Omit<Parameters<typeof syncConfigurationFromXML>[0], "xmlImportWorkerPoolHandle">
  ) => syncConfigurationFromXML({ ...params, xmlImportWorkerPoolHandle, projectState })
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
  let rootExternalFiles: {
    managedApplicationModule: string
    sessionModule: string
    externalConnectionModule: string
    ordinaryApplicationModule: string
    mobileClientSignature: number[]
    helpPage: string
    helpPicture: number[]
    mainSectionPictureXml: string
    mainSectionPicture: string
    logoXml: string
    logoPicture: number[]
    splashXml: string
    splashPicture: number[]
    standaloneConfigurationContent: number[]
    configurationYaml: string
  }
  let primaryImport: {
    result: Awaited<ReturnType<typeof syncConfigurationFromXMLForTest>>
    formYaml: string
    catalogYaml: string
    hasDocument: boolean
    hasNumerator: boolean
    hasLegacyNumerator: boolean
    hasSequence: boolean
    snapshot: Awaited<ReturnType<typeof readTestConfigurationIndex>>
    operationTempExists: boolean
  }
  let partialImportResult: Awaited<ReturnType<typeof syncConfigurationFromXMLForTest>>
  let fullRootImport: {
    result: Awaited<ReturnType<typeof syncConfigurationFromXMLForTest>>
    yaml: string
  }

  beforeAll(async () => {
    const tmp = fs.mkdtempSync(join(os.tmpdir(), "nkdk-root-external-from-xml-"))
    const rootInput = join(tmp, "xml")
    const rootProject = join(tmp, "project")
    const rootOutput = join(rootProject, "cf")
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
      fs.copyFileSync(
        join(rootCommandInterfaceFixturesDir, "CommandInterface.xml"),
        join(rootInput, "Ext", "CommandInterface.xml")
      )
      fs.copyFileSync(
        join(rootCommandInterfaceFixturesDir, "MainSectionCommandInterface.xml"),
        join(rootInput, "Ext", "MainSectionCommandInterface.xml")
      )
      fs.copyFileSync(
        join(clientApplicationInterfaceFixturesDir, "ClientApplicationInterface.xml"),
        join(rootInput, "Ext", "ClientApplicationInterface.xml")
      )
      fs.writeFileSync(join(rootInput, "Ext", "HomePageWorkArea.xml"), homePageWorkAreaXML, "utf-8")
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

      await syncConfigurationFromXMLForTest({
        context: mockContextFromXML(),
        inputDir: rootInput,
        projectDir: rootProject,
      })

      rootExternalFiles = {
        managedApplicationModule: fs.readFileSync(join(rootOutput, "МодульПриложения.bsl"), "utf-8"),
        sessionModule: fs.readFileSync(join(rootOutput, "МодульСеанса.bsl"), "utf-8"),
        externalConnectionModule: fs.readFileSync(join(rootOutput, "МодульВнешнегоСоединения.bsl"), "utf-8"),
        ordinaryApplicationModule: fs.readFileSync(join(rootOutput, "МодульОбычногоПриложения.bsl"), "utf-8"),
        mobileClientSignature: [...fs.readFileSync(join(rootOutput, "ПодписьМобильногоКлиента.bin"))],
        helpPage: fs.readFileSync(join(rootOutput, "Справка", "ru.html"), "utf-8"),
        helpPicture: [...fs.readFileSync(join(rootOutput, "Справка", "_files", "logo.png"))],
        mainSectionPictureXml: fs.readFileSync(
          join(rootOutput, "КартинкаОсновногоРаздела", "MainSectionPicture.xml"),
          "utf-8"
        ),
        mainSectionPicture: fs.readFileSync(
          join(rootOutput, "КартинкаОсновногоРаздела", "Picture.svg"),
          "utf-8"
        ),
        logoXml: fs.readFileSync(join(rootOutput, "Логотип", "Logo.xml"), "utf-8"),
        logoPicture: [...fs.readFileSync(join(rootOutput, "Логотип", "Picture.png"))],
        splashXml: fs.readFileSync(join(rootOutput, "Заставка", "Splash.xml"), "utf-8"),
        splashPicture: [...fs.readFileSync(join(rootOutput, "Заставка", "Picture.png"))],
        standaloneConfigurationContent: [
          ...fs.readFileSync(join(rootOutput, "СодержимоеАвтономнойКонфигурации.bin")),
        ],
        configurationYaml: fs.readFileSync(join(rootOutput, CONFIGURATION_YAML_FILE), "utf-8"),
      }
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }

    fs.rmSync(inputDir, { recursive: true, force: true })
    fs.rmSync(projectDir, { recursive: true, force: true })
    fs.cpSync(sourceInputDir, inputDir, { recursive: true })
    fs.copyFileSync(join(__dirname, "__fixtures__/minimal.xml"), join(inputDir, CONFIGURATION_XML_FILE))
    const operationId = "fixture-import"
    const result = await syncConfigurationFromXMLForTest({
      context: mockContextFromXML(),
      inputDir,
      projectDir,
      operationId,
    })
    primaryImport = {
      result,
      formYaml: fs.readFileSync(
        join(outputDir, "Справочник", "Контрагенты", "Формы", "ФормаЭлемента", "Форма.yaml"),
        "utf-8"
      ),
      catalogYaml: fs.readFileSync(join(outputDir, "Справочник", "Контрагенты", "Свойства.yaml"), "utf-8"),
      hasDocument: fs.existsSync(join(outputDir, "Документ", "ДокументПоУмолчанию", "Свойства.yaml")),
      hasNumerator: fs.existsSync(join(outputDir, "Нумератор", "НумераторПоУмолчанию.yaml")),
      hasLegacyNumerator: fs.existsSync(
        join(outputDir, "Нумератор", "НумераторПоУмолчанию", "Свойства.yaml"),
      ),
      hasSequence: fs.existsSync(join(outputDir, "Последовательность", "ПоследовательностьПоУмолчанию", "Свойства.yaml")),
      snapshot: await readTestConfigurationIndex(projectDir),
      operationTempExists: fs.existsSync(join(projectDir, ".nkdk", "tmp", "import", operationId)),
    }
    partialImportResult = await importTemporaryConfiguration(
      join(__dirname, "__fixtures__/minimal.xml"),
      true,
    ).then(({ result }) => result)
    fullRootImport = await importTemporaryConfiguration(join(__dirname, "__fixtures__/full.xml"))
  })

  async function importTemporaryConfiguration(xmlPath: string, withCatalogs = false) {
    const tmp = fs.mkdtempSync(join(os.tmpdir(), "nkdk-root-from-xml-"))
    const rootInput = join(tmp, "xml")
    const rootProject = join(tmp, "project")
    try {
      fs.mkdirSync(withCatalogs ? join(rootInput, "Catalogs") : rootInput, { recursive: true })
      fs.copyFileSync(xmlPath, join(rootInput, CONFIGURATION_XML_FILE))
      const result = await syncConfigurationFromXMLForTest({
        context: mockContextFromXML(),
        inputDir: rootInput,
        projectDir: rootProject,
      })
      return {
        result,
        yaml: fs.readFileSync(join(rootProject, "cf", CONFIGURATION_YAML_FILE), "utf-8"),
      }
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  }

  afterAll(async () => {
    await xmlImportWorkerPoolHandle.close()
    await projectState.close()
    fs.rmSync(inputDir, { recursive: true, force: true })
    fs.rmSync(projectDir, { recursive: true, force: true })
  })

  beforeEach(() => {
    fs.rmSync(inputDir, { recursive: true, force: true })
    fs.rmSync(projectDir, { recursive: true, force: true })
    fs.cpSync(sourceInputDir, inputDir, { recursive: true })
    fs.copyFileSync(join(__dirname, "__fixtures__/minimal.xml"), join(inputDir, CONFIGURATION_XML_FILE))
  })

  it("should produce catalog and form YAML in output dir", () => {
    const expectedFormYaml = readXMLFileAsString(
      join("sync/syncConfiguration/yaml/Справочник/Контрагенты/Формы/ФормаЭлемента", "Форма.yaml")
    )

    const expectedCatalogYaml = readXMLFileAsString(
      join("sync/syncConfiguration/yaml/Справочник/Контрагенты", "Свойства.yaml")
    )

    expect(primaryImport.catalogYaml).toBe(expectedCatalogYaml.replaceAll("\r\n", "\n"))
    expect(primaryImport.formYaml).toBe(expectedFormYaml.replaceAll("\r\n", "\n"))
    expect(primaryImport.hasDocument).toBe(true)
    expect(primaryImport.hasNumerator).toBe(true)
    expect(primaryImport.hasLegacyNumerator).toBe(false)
    expect(primaryImport.hasSequence).toBe(true)
    expect(primaryImport.result.failed).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "project_validation", severity: "error" }),
    ]))
    expect(primaryImport.result.warnings).toEqual([])
    expect(
      primaryImport.snapshot.entities.find(({ logicalAddress }) => logicalAddress === "Справочник.Контрагенты")
    ).toMatchObject({
      sourceProjectPath: "Справочник/Контрагенты/Свойства.yaml",
    })
    expect(
      primaryImport.snapshot.entities.find(
        ({ logicalAddress }) => logicalAddress === "Справочник.Контрагенты.Форма.ФормаЭлемента"
      )
    ).toMatchObject({
      sourceProjectPath: "Справочник/Контрагенты/Формы/ФормаЭлемента/Форма.yaml",
    })
    expect(
      primaryImport.snapshot.entities.every((entity) =>
        primaryImport.snapshot.files.some((file) => file.projectPath === entity.sourceProjectPath)
      )
    ).toBe(true)
    expect(
      primaryImport.snapshot.entities.every(
        (entity) => entity.uuid !== undefined || entity.xmlId !== undefined || entity.children !== undefined
      )
    ).toBe(true)
    expect(primaryImport.operationTempExists).toBe(false)
  })

  it("не падает на дампе без некоторых корневых разделов", () => {
    expect(partialImportResult.failed).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "project_validation", severity: "error" }),
    ]))
  })

  it("пишет корневой файл Конфигурация.yaml из Configuration.xml", () => {
    expect(fullRootImport.result.failed).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "project_validation", severity: "error" }),
    ]))
    expect(fullRootImport.yaml).toContain("Имя: Конфигурация")
    expect(fullRootImport.yaml).not.toContain("ChildObjects")
  })

  it("импортирует корневые XML из Ext в Конфигурация.yaml", () => {
    const yaml = rootExternalFiles.configurationYaml

    expect(yaml).toContain("КомандныйИнтерфейс:")
    expect(yaml).toContain("ВидимостьПодсистем:")
    expect(yaml).toContain("ПодсистемаПоУмолчанию:")
    expect(yaml).toContain("КомандныйИнтерфейсОсновногоРаздела:")
    expect(yaml).toContain("ПорядокГрупп:")
    expect(yaml).toContain("ПанельНавигацииВажное")
    expect(yaml).toContain("ИнтерфейсКлиентскогоПриложения:")
    expect(yaml).toContain("Верх:")
    expect(yaml).toContain("ПанельФункцийТекущегоРаздела")
    expect(yaml).toContain("Представление: КартинкаСлеваИТекст")
    expect(yaml).not.toContain("left-history")
    expect(yaml).toContain("РабочаяОбластьНачальнойСтраницы:")
    expect(yaml).toContain("ШаблонРабочейОбласти: ДвеКолонкиПеременнойШирины")
    expect(yaml).toContain("Форма: CommonForm.НачалоРаботы")
    expect(yaml).toContain("Администратор: Ложь")
    expect(yaml).toContain("ОтображениеКомандногоИнтерфейса: Верх")
  })

  it("сохраняет простые корневые внешние файлы конфигурации", () => {
    const managedApplicationModule = "Процедура ПриНачалеРаботыСистемы()\nКонецПроцедуры\n"
    const sessionModule = "Процедура ПриНачалеСеанса()\nКонецПроцедуры\n"
    const externalConnectionModule = "Процедура ПриНачалеРаботыСистемы()\nКонецПроцедуры\n"
    const ordinaryApplicationModule = "Процедура ПередНачаломРаботыСистемы()\nКонецПроцедуры\n"
    const helpPage = "<html><body>Справка</body></html>"

    expect(rootExternalFiles.managedApplicationModule).toBe(managedApplicationModule)
    expect(rootExternalFiles.sessionModule).toBe(sessionModule)
    expect(rootExternalFiles.externalConnectionModule).toBe(externalConnectionModule)
    expect(rootExternalFiles.ordinaryApplicationModule).toBe(ordinaryApplicationModule)
    expect(rootExternalFiles.mobileClientSignature).toEqual([0, 1, 2, 255])
    expect(rootExternalFiles.helpPage).toBe(helpPage)
    expect(rootExternalFiles.helpPicture).toEqual([137, 80])
    expect(rootExternalFiles.mainSectionPictureXml).toBe("<MainSectionPicture/>")
    expect(rootExternalFiles.mainSectionPicture).toBe("<svg/>")
    expect(rootExternalFiles.logoXml).toBe("<Logo/>")
    expect(rootExternalFiles.logoPicture).toEqual([1, 2, 3])
    expect(rootExternalFiles.splashXml).toBe("<Splash/>")
    expect(rootExternalFiles.splashPicture).toEqual([137, 80, 78, 71])
    expect(rootExternalFiles.standaloneConfigurationContent).toEqual([4, 5, 6])
    expect(rootExternalFiles.configurationYaml).not.toContain("МодульПриложения")
  })
})

async function readTestConfigurationIndex(projectDir: string): Promise<{
  readonly files: readonly ConfigurationProjectFile[]
  readonly entities: readonly (ConfigurationIndexBlockEntity & { readonly sourceProjectPath: string })[]
}> {
  const descriptor = configurationIndexStoreDescriptor(projectDir, { kind: "configuration" })
  const store = openConfigurationIndexStore(descriptor, "readOnly")
  try {
    const files = store.readHashes()
    const blocks = store.getBlocks(files.map(({ projectPath }) => projectPath))
    return {
      files,
      entities: [...blocks].flatMap(([sourceProjectPath, block]) =>
        block.entities.map((entity) => ({ ...entity, sourceProjectPath }))),
    }
  } finally {
    await store.close()
  }
}
