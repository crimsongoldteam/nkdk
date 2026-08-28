import {
parseWithJsYaml
} from "@nkdk/runtime"
import {
configurationIndexStoreDescriptor,
openConfigurationIndexStore,
} from "@nkdk/runtime/configuration-index-store"
import fs from "node:fs"
import os from "node:os"
import { dirname,join } from "node:path"
import { fileURLToPath } from "node:url"
import { afterAll,beforeAll,describe,expect,it } from "vitest"
import { mockContextFromXML } from "../../tests/mockContext"
import "../../tests/metadataExecutionContext"
import { createPreparedYamlWorkerThreadPoolFactory } from "../../tests/preparedYamlWorkerTestPool"
import {
createImportProjectStateTestService,
createXmlImportWorkerTestPool,
} from "../../tests/xmlImportWorkerTestPool"
import { createPreparedYamlProjectWorkerPool } from "../project/preparedYamlProjectWorkerPool"
import { importConfigurationFromXml } from "./importConfiguration"

const fixtureDir = join(dirname(fileURLToPath(import.meta.url)), "__fixtures__", "configurationExtension")
const configurationFixtureDir = join(import.meta.dirname, "../appliedObjects/configuration/__fixtures__")
const catalogFixtureDir = join(import.meta.dirname, "../appliedObjects/metadataCatalog/__fixtures__")
const formFixtureDir = join(import.meta.dirname, "../forms/clientApplicationForm/__fixtures__")
const languageFixtureDir = join(import.meta.dirname, "../appliedObjects/metadataLanguage/__fixtures__")
const borrowedCommandBarButtonName = "ОбщаяПанельнаяКнопка"
const temporaryRoot = fs.mkdtempSync(join(os.tmpdir(), "nkdk-extension-import-"))
let temporaryDirectoryIndex = 0
const xmlImportWorkerPoolHandle = createXmlImportWorkerTestPool()
const preparedYamlWorkerFactory = createPreparedYamlWorkerThreadPoolFactory()
const projectState = createImportProjectStateTestService({
  createPool: (concurrency) => createPreparedYamlProjectWorkerPool({
    concurrency,
    createWorkerPool: preparedYamlWorkerFactory,
  }),
})
let importedExtension: Awaited<ReturnType<typeof importExtension>>

afterAll(async () => {
  await Promise.all([
    xmlImportWorkerPoolHandle.close(),
    projectState.close(),
  ])
  await fs.promises.rm(temporaryRoot, { recursive: true, force: true })
})

describe("configuration extension XML import", () => {
  beforeAll(async () => {
    importedExtension = await importExtension()
  })

  it("сохраняет структуру расширения и локализует импортированные аномалии", () => {
    const { projectDir, result, configuration, catalog, form, yamlText, catalogText, baseFormText, snapshot } = importedExtension

    expect(result).toMatchObject({
      componentPath: "cfe/РасширениеКонтроль",
      succeeded: 4,
      failed: [],
    })
    expect(result.warnings).toEqual([expect.objectContaining({ code: "unresolved_data_path" })])
    expect(configuration).toMatchObject({
      Имя: "РасширениеКонтроль",
      НазначениеРасширенияКонфигурации: "Адаптация",
      ОсновнойЯзык: "БазовыйЯзык",
    })
    expect(catalog).toMatchObject({
      Реквизиты: {
        РеквизитСправочника: { Синоним: "", Тип: "ЛюбаяСсылка", Формат: "ДФ=dd.MM.yyyy" },
        СобственныйРеквизит: { Синоним: "", Тип: "Строка(20)" },
      },
    })
    expect(form).toMatchObject({
      Элементы: {
        СобственноеПоле: { Вид: "ПолеВвода", Ширина: 10 },
        ПолеБазовогоРеквизита: {
          Вид: "ПолеНадписи",
          ПутьКДанным: "БазовыйОбъект.БазовыйРеквизит.Description",
        },
      },
    })
    expect(yamlText).toContain("ОсновнойЯзык: !xml/invalid БазовыйЯзык")
    expect(yamlText).toContain("ПутьКДанным: !xml/invalid БазовыйОбъект.БазовыйРеквизит.Description")
    expect(yamlText).toContain("Properties\\UnknownProperty: !xml/raw")
    expect(yamlText).toContain("Тип: !xml/raw")
    const borrowedAttributeYaml = textBetween(
      catalogText,
      "  РеквизитСправочника:",
      "  СобственныйРеквизит:",
    )
    expect(borrowedAttributeYaml).not.toContain("ПринадлежностьОбъекта: !xml/raw")
    expect(borrowedAttributeYaml).not.toContain("Properties: !xml/raw")

    const baseForm = readYaml(
      projectDir,
      "cfe/РасширениеКонтроль/Справочник/СправочникПолный/Формы/ФормаОтчета/БазоваяФорма.yaml",
    ) as Record<string, unknown>
    expect(baseForm).toMatchObject({ Элементы: { БазовоеПоле: { Вид: "ПолеВвода", Ширина: 99 } } })
    expect(baseFormText).toContain("!xml/invalid de: Hinweis")
    const entities = [...snapshot.blocks.values()].flatMap(({ entities }) => entities)
    expect(entities.some(
      ({ logicalAddress }) => logicalAddress === "Справочник.СправочникПолный.Форма.ФормаОтчета.form"
    )).toBe(false)
    expect(fs.existsSync(join(
      projectDir,
      ".nkdk/components/cfe/РасширениеКонтроль/configuration-index.lmdb",
    ))).toBe(true)
  })

  it("распознаёт заимствованное поле по текущей cf без встроенного BaseForm", () => {
    const { projectDir, formWithoutBase } = importedExtension

    expect((formWithoutBase as { Элементы: Record<string, unknown> }).Элементы.СобственноеПоле)
      .not.toHaveProperty("ПутьКДанным")
    expect((formWithoutBase as { Элементы: Record<string, { ПутьКДанным?: unknown }> }).Элементы.Код)
      .toMatchObject({ ПутьКДанным: "" })
    expect(fs.existsSync(join(
      projectDir,
      "cfe/РасширениеКонтроль/Справочник/СправочникПолный/Формы/ФормаБезОсновы/БазоваяФорма.yaml",
    ))).toBe(false)
  })

})

async function importExtension() {
  const projectDir = temporaryDirectory()
  await importBaseConfiguration(projectDir)
  const inputDir = temporaryDirectory()
  fs.cpSync(fixtureDir, inputDir, { recursive: true })
  for (const relativePath of [
    "Configuration.xml",
    "Catalogs/СправочникПолный.xml",
    "Catalogs/СправочникПолный/Forms/ФормаОтчета.xml",
  ]) {
    removeUnknownPropertyStates(join(inputDir, ...relativePath.split("/")))
  }
  replaceExactlyOnce(
    join(inputDir, "Catalogs", "СправочникПолный", "Forms", "ФормаОтчета", "Ext", "Form.xml"),
    "\t\t\t\t<Width>99</Width>",
    [
      "\t\t\t\t<Width>99</Width>",
      "\t\t\t\t<ToolTip>",
      "\t\t\t\t\t<v8:item>",
      "\t\t\t\t\t\t<v8:lang>de</v8:lang>",
      "\t\t\t\t\t\t<v8:content>Hinweis</v8:content>",
      "\t\t\t\t\t</v8:item>",
      "\t\t\t\t</ToolTip>",
    ].join("\n"),
  )
  replaceExactlyOnce(
    join(inputDir, "Configuration.xml"),
    "\t\t\t<Name>РасширениеКонтроль</Name>",
    [
      "\t\t\t<Name>РасширениеКонтроль</Name>",
      "\t\t\t<Synonym>",
      "\t\t\t\t<v8:item>",
      "\t\t\t\t\t<v8:lang>ru</v8:lang>",
      "\t\t\t\t\t<v8:content>Расширение контроль</v8:content>",
      "\t\t\t\t</v8:item>",
      "\t\t\t</Synonym>",
    ].join("\n"),
  )
  replaceExactlyOnce(
    join(inputDir, "Configuration.xml"),
    "\t\t\t<DefaultRunMode>ManagedApplication</DefaultRunMode>",
    "\t\t\t<ConfigurationExtensionCompatibilityMode>Version8_3_20</ConfigurationExtensionCompatibilityMode>\n" +
      "\t\t\t<DefaultRunMode>ManagedApplication</DefaultRunMode>"
  )
  replaceExactlyOnce(
    join(inputDir, "Catalogs", "СправочникПолный", "Forms", "ФормаОтчета", "Ext", "Form.xml"),
    "\t\t<LabelField name=\"ПолеБазовогоРеквизита\" id=\"5\">",
    [
      "\t\t<InputField name=\"Код\" id=\"20\">",
      "\t\t\t<ContextMenu name=\"КодКонтекстноеМеню\" id=\"21\"/>",
      "\t\t\t<ExtendedTooltip name=\"КодРасширеннаяПодсказка\" id=\"22\"/>",
      "\t\t</InputField>",
      "\t\t<LabelField name=\"ПолеБазовогоРеквизита\" id=\"5\">",
    ].join("\n")
  )
  replaceExactlyOnce(
    join(inputDir, "Catalogs", "СправочникПолный", "Forms", "ФормаОтчета", "Ext", "Form.xml"),
    "\t\t</Attributes>\n\t</BaseForm>",
    [
      "\t\t\t<ConditionalAppearance>",
      "\t\t\t\t<dcsset:item>",
      "\t\t\t\t\t<dcsset:selection><dcsset:item><dcsset:field>НеизвестныйЭлементОсновы</dcsset:field></dcsset:item></dcsset:selection>",
      "\t\t\t\t\t<dcsset:filter>",
      "\t\t\t\t\t\t<dcsset:item xsi:type=\"dcsset:FilterItemComparison\">",
      "\t\t\t\t\t\t\t<dcsset:left xsi:type=\"dcscor:Field\">НеизвестныйИсточник.Поле</dcsset:left>",
      "\t\t\t\t\t\t\t<dcsset:comparisonType>Equal</dcsset:comparisonType>",
      "\t\t\t\t\t\t\t<dcsset:right xsi:type=\"xs:boolean\">true</dcsset:right>",
      "\t\t\t\t\t\t</dcsset:item>",
      "\t\t\t\t\t</dcsset:filter>",
      "\t\t\t\t\t<dcsset:appearance/>",
      "\t\t\t\t</dcsset:item>",
      "\t\t\t</ConditionalAppearance>",
      "\t\t</Attributes>",
      "\t</BaseForm>",
    ].join("\n")
  )
  replaceExactlyOnce(
    join(inputDir, "Catalogs", "СправочникПолный", "Forms", "ФормаОтчета", "Ext", "Form.xml"),
    "\t<BaseForm version=\"2.20\">\n\t\t<AutoCommandBar name=\"ФормаКоманднаяПанель\" id=\"-1\"/>",
    [
      "\t<BaseForm version=\"2.20\">",
      "\t\t<AutoCommandBar name=\"ФормаКоманднаяПанель\" id=\"-1\">",
      "\t\t\t<ChildItems>",
      `\t\t\t\t<Button name=\"${borrowedCommandBarButtonName}\" id=\"10\">`,
      "\t\t\t\t\t<Type>CommandBarButton</Type>",
      "\t\t\t\t\t<CommandName>Form.StandardCommand.Close</CommandName>",
      "\t\t\t\t</Button>",
      "\t\t\t</ChildItems>",
      "\t\t</AutoCommandBar>",
    ].join("\n"),
  )
  replaceExactlyOnce(
    join(inputDir, "Catalogs", "СправочникПолный.xml"),
    "<v8:Type>xs:dateTime</v8:Type>",
    "<v8:TypeSet>cfg:AnyRef</v8:TypeSet>"
  )
  replaceExactlyOnce(
    join(inputDir, "Catalogs", "СправочникПолный", "Forms", "ФормаОтчета", "Ext", "Form.xml"),
    "<v8:Type>xs:string</v8:Type>",
    "<v8:TypeSet>cfg:AnyRef</v8:TypeSet>"
  )
  replaceExactlyOnce(
    join(inputDir, "Catalogs", "СправочникПолный", "Forms", "ФормаОтчета", "Ext", "Form.xml"),
    "\t\t<Attribute name=\"БазовыйОбъект\" id=\"8\">\n\t\t\t<Type>\n\t\t\t\t<v8:Type>cfg:CatalogObject.БазовыйСправочник</v8:Type>\n\t\t\t</Type>\n\t\t</Attribute>",
    "\t\t<Attribute name=\"БазовыйОбъект\" id=\"8\">\n\t\t\t<Type>\n\t\t\t\t<v8:Type>cfg:CatalogObject.СправочникПолный</v8:Type>\n\t\t\t</Type>\n\t\t</Attribute>"
  )
  addFormWithoutBase(inputDir)

  const result = await importConfigurationFromXml({
    context: mockContextFromXML(),
    inputDir,
    projectDir,
    concurrency: 1,
    operationId: "configuration-extension-e2e",
    xmlImportWorkerPoolHandle,
    projectState,
  })
  const importedFormPath = join(
    projectDir,
    "cfe/РасширениеКонтроль/Справочник/СправочникПолный/Формы/ФормаОтчета/Форма.yaml",
  )
  if (!fs.existsSync(importedFormPath)) throw new Error(`Импорт не создал форму: ${JSON.stringify(result)}`)
  const importedCatalogPath = join(
    projectDir,
    "cfe/РасширениеКонтроль/Справочник/СправочникПолный/Свойства.yaml",
  )
  if (!fs.existsSync(importedCatalogPath)) throw new Error(`Импорт не создал справочник: ${JSON.stringify(result)}`)
  const importedConfigurationPath = join(projectDir, "cfe/РасширениеКонтроль/Конфигурация.yaml")
  if (!fs.existsSync(importedConfigurationPath)) {
    throw new Error(`Импорт не создал конфигурацию расширения: ${JSON.stringify(result)}`)
  }
  const configuration = readYaml(projectDir, "cfe/РасширениеКонтроль/Конфигурация.yaml")
  const catalog = readYaml(projectDir, "cfe/РасширениеКонтроль/Справочник/СправочникПолный/Свойства.yaml")
  const form = readYaml(projectDir, "cfe/РасширениеКонтроль/Справочник/СправочникПолный/Формы/ФормаОтчета/Форма.yaml")
  const formWithoutBase = readYaml(
    projectDir,
    "cfe/РасширениеКонтроль/Справочник/СправочникПолный/Формы/ФормаБезОсновы/Форма.yaml",
  )
  const catalogText = readText(
    projectDir,
    "cfe/РасширениеКонтроль/Справочник/СправочникПолный/Свойства.yaml",
  )
  const baseFormText = readText(
    projectDir,
    "cfe/РасширениеКонтроль/Справочник/СправочникПолный/Формы/ФормаОтчета/БазоваяФорма.yaml",
  )
  const yamlText = [
    readText(projectDir, "cfe/РасширениеКонтроль/Конфигурация.yaml"),
    catalogText,
    readText(projectDir, "cfe/РасширениеКонтроль/Справочник/СправочникПолный/Формы/ФормаОтчета/Форма.yaml"),
  ].join("\n")
  const descriptor = configurationIndexStoreDescriptor(projectDir, {
    kind: "configurationExtension",
    name: "РасширениеКонтроль",
  })
  if (!fs.existsSync(descriptor.dataPath)) throw new Error(`Импорт не создал снимок: ${JSON.stringify(result)}`)
  const store = openConfigurationIndexStore(descriptor, "readOnly")
  const hashes = store.readHashes()
  const snapshot = { hashes, blocks: store.getBlocks(hashes.map(({ projectPath }) => projectPath)) }
  await store.close()

  return { projectDir, result, configuration, catalog, form, formWithoutBase, yamlText, catalogText, baseFormText, snapshot }
}

function textBetween(source: string, startMarker: string, endMarker: string): string {
  const start = source.indexOf(startMarker)
  const end = source.indexOf(endMarker, start + startMarker.length)
  if (start < 0 || end < 0) {
    throw new Error(`Не найдены границы YAML-фрагмента: ${startMarker} / ${endMarker}`)
  }
  return source.slice(start, end)
}

async function importBaseConfiguration(projectDir: string): Promise<void> {
  const inputDir = temporaryDirectory()
  const configurationPath = join(inputDir, "Configuration.xml")
  fs.copyFileSync(join(configurationFixtureDir, "minimal.xml"), configurationPath)
  replaceExactlyOnce(
    configurationPath,
    "\t\t</Properties>",
    [
      "\t\t\t<DefaultLanguage>Language.БазовыйЯзык</DefaultLanguage>",
      "\t\t</Properties>",
      "\t\t<ChildObjects><Language>БазовыйЯзык</Language></ChildObjects>",
    ].join("\n"),
  )

  const catalogPath = join(inputDir, "Catalogs", "СправочникПолный.xml")
  fs.mkdirSync(dirname(catalogPath), { recursive: true })
  fs.copyFileSync(join(catalogFixtureDir, "minimal.xml"), catalogPath)
  replaceAllInFile(catalogPath, "ПоУмолчанию", "СправочникПолный")
  replaceExactlyOnce(
    catalogPath,
    "\t\t<ChildObjects/>",
    [
      "\t\t<ChildObjects>",
      "\t\t\t<Attribute uuid=\"55555555-5555-4555-8555-555555555555\">",
      "\t\t\t\t<Properties>",
      "\t\t\t\t\t<Name>РеквизитСправочника</Name>",
      "\t\t\t\t\t<Synonym/>",
      "\t\t\t\t\t<Type><v8:Type>xs:dateTime</v8:Type><v8:DateQualifiers><v8:DateFractions>Date</v8:DateFractions></v8:DateQualifiers></Type>",
      "\t\t\t\t</Properties>",
      "\t\t\t</Attribute>",
      "\t\t\t<Form>ФормаОтчета</Form>",
      "\t\t\t<Form>ФормаБезОсновы</Form>",
      "\t\t</ChildObjects>",
    ].join("\n"),
  )

  for (const formName of ["ФормаОтчета", "ФормаБезОсновы"]) {
    const formsDir = join(inputDir, "Catalogs", "СправочникПолный", "Forms")
    const metadataPath = join(formsDir, `${formName}.xml`)
    const bodyPath = join(formsDir, formName, "Ext", "Form.xml")
    fs.mkdirSync(dirname(bodyPath), { recursive: true })
    fs.copyFileSync(join(formFixtureDir, "minimalMetadata.xml"), metadataPath)
    replaceAllInFile(metadataPath, "Минимальная", formName)
    fs.copyFileSync(join(formFixtureDir, "minimal.xml"), bodyPath)
    if (formName === "ФормаОтчета") {
      replaceExactlyOnce(
        bodyPath,
        "\t<AutoCommandBar name=\"ФормаКоманднаяПанель\" id=\"-1\"/>",
        [
          "\t<AutoCommandBar name=\"ФормаКоманднаяПанель\" id=\"-1\">",
          "\t\t<ChildItems>",
          `\t\t\t<Button name=\"${borrowedCommandBarButtonName}\" id=\"10\">`,
          "\t\t\t\t<Type>CommandBarButton</Type>",
          "\t\t\t\t<CommandName>Form.StandardCommand.Close</CommandName>",
          "\t\t\t</Button>",
          "\t\t</ChildItems>",
          "\t</AutoCommandBar>",
        ].join("\n"),
      )
      replaceExactlyOnce(
        bodyPath,
        "\t<Attributes/>",
        [
          "\t<ChildItems>",
          "\t\t<InputField name=\"БазовоеПоле\" id=\"1\">",
          "\t\t\t<DataPath>БазовыйРеквизитФормы</DataPath>",
          "\t\t\t<Width>99</Width>",
          "\t\t\t<ContextMenu name=\"БазовоеПолеКонтекстноеМеню\" id=\"2\"/>",
          "\t\t\t<ExtendedTooltip name=\"БазовоеПолеРасширеннаяПодсказка\" id=\"3\"/>",
          "\t\t</InputField>",
          "\t</ChildItems>",
          ...baseFormAttributesXml(),
        ].join("\n"),
      )
    } else {
      replaceExactlyOnce(bodyPath, "\t<Attributes/>", baseFormAttributesXml().join("\n"))
    }
  }

  const languagePath = join(inputDir, "Languages", "БазовыйЯзык.xml")
  fs.mkdirSync(dirname(languagePath), { recursive: true })
  fs.copyFileSync(join(languageFixtureDir, "ru.xml"), languagePath)
  replaceExactlyOnce(languagePath, "<Name>Русский</Name>", "<Name>БазовыйЯзык</Name>")

  const result = await importConfigurationFromXml({
    context: mockContextFromXML(),
    inputDir,
    projectDir,
    concurrency: 1,
    operationId: "configuration-base-e2e",
    xmlImportWorkerPoolHandle,
    projectState,
  })
  expect(result.failed).toEqual([])
  expect(result.componentPath).toBe("cf")
  expect(result.succeeded).toBe(5)
}

function baseFormAttributesXml(): string[] {
  return [
    "\t<Attributes>",
    "\t\t<Attribute name=\"БазовыйРеквизитФормы\" id=\"4\">",
    "\t\t\t<Type><v8:Type>xs:dateTime</v8:Type></Type>",
    "\t\t</Attribute>",
    "\t\t<Attribute name=\"БазовыйОбъект\" id=\"5\">",
    "\t\t\t<Type><v8:Type>cfg:CatalogObject.СправочникПолный</v8:Type></Type>",
    "\t\t\t<MainAttribute>true</MainAttribute>",
    "\t\t</Attribute>",
    "\t</Attributes>",
  ]
}

function addFormWithoutBase(inputDir: string): void {
  const catalogDir = join(inputDir, "Catalogs", "СправочникПолный")
  const formsDir = join(catalogDir, "Forms")
  const sourceMetadataPath = join(formsDir, "ФормаОтчета.xml")
  const targetMetadataPath = join(formsDir, "ФормаБезОсновы.xml")
  const targetFormDir = join(formsDir, "ФормаБезОсновы")
  fs.copyFileSync(sourceMetadataPath, targetMetadataPath)
  fs.cpSync(join(formsDir, "ФормаОтчета"), targetFormDir, { recursive: true })
  replaceExactlyOnce(
    targetMetadataPath,
    "77777777-7777-4777-8777-777777777777",
    "99999999-9999-4999-8999-999999999999",
  )
  replaceExactlyOnce(
    targetMetadataPath,
    "88888888-8888-4888-8888-888888888888",
    "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  )
  replaceExactlyOnce(targetMetadataPath, "<Name>ФормаОтчета</Name>", "<Name>ФормаБезОсновы</Name>")
  const targetFormPath = join(targetFormDir, "Ext", "Form.xml")
  removeBaseFormElement(targetFormPath)
  replaceExactlyOnce(
    targetFormPath,
    [
      "\t\t<LabelField name=\"ПолеБазовогоРеквизита\" id=\"5\">",
      "\t\t\t<DataPath>БазовыйОбъект.БазовыйРеквизит.Description</DataPath>",
      "\t\t\t<ContextMenu name=\"ПолеБазовогоРеквизитаКонтекстноеМеню\" id=\"6\"/>",
      "\t\t\t<ExtendedTooltip name=\"ПолеБазовогоРеквизитаРасширеннаяПодсказка\" id=\"7\"/>",
      "\t\t</LabelField>\n",
    ].join("\n"),
    "",
  )
  replaceExactlyOnce(
    join(inputDir, "Catalogs", "СправочникПолный.xml"),
    "\t\t\t<Form>ФормаОтчета</Form>",
    "\t\t\t<Form>ФормаОтчета</Form>\n\t\t\t<Form>ФормаБезОсновы</Form>",
  )
}

function removeBaseFormElement(path: string): void {
  const content = fs.readFileSync(path, "utf8")
  const start = content.indexOf("\t<BaseForm version=\"2.20\">")
  const closing = "\t</BaseForm>"
  const end = content.indexOf(closing, start)
  if (start === -1 || end === -1) throw new Error(`Не найден BaseForm: ${path}`)
  fs.writeFileSync(path, content.slice(0, start) + content.slice(end + closing.length + 1))
}

function replaceExactlyOnce(path: string, source: string, replacement: string): void {
  const content = fs.readFileSync(path, "utf8")
  const first = content.indexOf(source)
  if (first === -1 || content.indexOf(source, first + source.length) !== -1) {
    throw new Error(`Ожидалось ровно одно вхождение в ${path}: ${source}`)
  }
  fs.writeFileSync(path, content.slice(0, first) + replacement + content.slice(first + source.length))
}

function replaceAllInFile(path: string, source: string, replacement: string): void {
  const content = fs.readFileSync(path, "utf8")
  if (!content.includes(source)) throw new Error(`Не найдено вхождение в ${path}: ${source}`)
  fs.writeFileSync(path, content.replaceAll(source, replacement))
}

function removeUnknownPropertyStates(path: string): void {
  const content = fs.readFileSync(path, "utf8")
  const withoutFutureState = content.replace(
    /\s*<xr:PropertyState>\s*<xr:Property>[^<]+<\/xr:Property>\s*<xr:State>FutureState<\/xr:State>\s*<\/xr:PropertyState>/gu,
    "",
  )
  fs.writeFileSync(path, withoutFutureState.replace(
    /\s*<xr:PropertyState>\s*<xr:Property>UnknownProperty<\/xr:Property>\s*<xr:State>[^<]+<\/xr:State>\s*<\/xr:PropertyState>/gu,
    "",
  ))
}

function temporaryDirectory(): string {
  const directory = join(temporaryRoot, String(temporaryDirectoryIndex++))
  fs.mkdirSync(directory)
  return directory
}

function readYaml(projectDir: string, relativePath: string): unknown {
  const parsed = parseWithJsYaml(readText(projectDir, relativePath))
  if (parsed.syntaxErrors.length > 0) throw parsed.syntaxErrors[0]
  return parsed.data
}

function readText(projectDir: string, relativePath: string): string {
  return fs.readFileSync(join(projectDir, ...relativePath.split("/")), "utf8")
}
