import fs from "node:fs"
import os from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { load } from "js-yaml"
import { configurationIndexPath, importConfigurationFromXml, readConfigurationIndex } from "../../index"
import { mockContextFromXML } from "../../tests/mockContext"
import {
  createImportProjectStateTestService,
  createXmlImportWorkerTestPool,
} from "../../tests/xmlImportWorkerTestPool"
import { createPreparedYamlWorkerThreadPoolFactory } from "../../tests/preparedYamlWorkerTestPool"
import { createPreparedYamlProjectWorkerPool } from "../project/preparedYamlProjectWorkerPool"

const fixtureDir = join(dirname(fileURLToPath(import.meta.url)), "__fixtures__", "configurationExtension")
const configurationFixtureDir = join(import.meta.dirname, "../appliedObjects/configuration/__fixtures__")
const catalogFixtureDir = join(import.meta.dirname, "../appliedObjects/metadataCatalog/__fixtures__")
const formFixtureDir = join(import.meta.dirname, "../forms/clientApplicationForm/__fixtures__")
const languageFixtureDir = join(import.meta.dirname, "../appliedObjects/metadataLanguage/__fixtures__")
const borrowedCommandBarButtonName = "ОбщаяПанельнаяКнопка"
const temporaryDirectories: string[] = []
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
  await xmlImportWorkerPoolHandle.close()
  await projectState.close()
  for (const directory of temporaryDirectories.splice(0)) {
    fs.rmSync(directory, { recursive: true, force: true })
  }
})

describe("configuration extension XML import", () => {
  beforeAll(async () => {
    importedExtension = await importExtension()
  })

  it("imports extension controls, own children and an extended form through the public API", () => {
    const { projectDir, result, configuration, catalog, form, yamlText, snapshot } = importedExtension

    expect(result).toEqual({
      componentPath: "cfe/РасширениеКонтроль",
      succeeded: 4,
      failed: [
        {
          severity: "error",
          code: "project_validation",
          message: 'Ссылка "Language.БазовыйЯзык" не включена в расширение',
          targetProjectPath: "cfe/РасширениеКонтроль/Конфигурация.yaml",
        },
        {
          severity: "error",
          code: "project_validation",
          message: 'ПутьКДанным "БазовыйОбъект.БазовыйРеквизит.Description": неизвестный реквизит "БазовыйРеквизит"',
          targetProjectPath:
            "cfe/РасширениеКонтроль/Справочник/СправочникПолный/Формы/ФормаБезОсновы/Форма.yaml",
        },
        {
          severity: "error",
          code: "project_validation",
          message: 'ПутьКДанным "БазовыйОбъект.БазовыйРеквизит.Description": неизвестный реквизит "БазовыйРеквизит"',
          targetProjectPath:
            "cfe/РасширениеКонтроль/Справочник/СправочникПолный/Формы/ФормаОтчета/Форма.yaml",
        },
      ],
      warnings: [
        {
          severity: "warning",
          code: "unresolved_data_path",
          message: "Не удалось преобразовать ПутьКДанным: БазовыйОбъект.БазовыйРеквизит.Description",
          targetProjectPath: "Справочник/СправочникПолный/Формы/ФормаБезОсновы/Форма.yaml",
          value: "БазовыйОбъект.БазовыйРеквизит.Description",
        },
        {
          severity: "warning",
          code: "unresolved_data_path",
          message: "Не удалось преобразовать ПутьКДанным: БазовыйОбъект.БазовыйРеквизит.Description",
          targetProjectPath: "Справочник/СправочникПолный/Формы/ФормаОтчета/Форма.yaml",
          value: "БазовыйОбъект.БазовыйРеквизит.Description",
        },
      ],
      configurationIndexPath: configurationIndexPath(projectDir, {
        kind: "configurationExtension",
        name: "РасширениеКонтроль",
      }),
    })
    expect(result.failed).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ message: expect.stringContaining("Не найдена текущая форма cf") }),
    ]))
    const importButtonDiagnostics = result.warnings
      .filter(({ message }) => message.includes(borrowedCommandBarButtonName))
    const validationButtonDiagnostics = importedExtension.validationDiagnostics
      .filter(({ message }) => message.includes(borrowedCommandBarButtonName))
    expect(importButtonDiagnostics).toEqual([])
    expect(validationButtonDiagnostics).toEqual([])

    expect(configuration).toEqual({
      Имя: "РасширениеКонтроль",
      НазначениеРасширенияКонфигурации: "Адаптация",
      РежимСовместимостиРасширенияКонфигурации: "Версия8_3_20",
      ОсновнойРежимЗапуска: "УправляемоеПриложение",
      ОсновнойЯзык: "БазовыйЯзык",
      Контроль: ["ОсновнойРежимЗапуска"],
    })

    expect(catalog).toEqual({
      Реквизиты: {
        РеквизитСправочника: {
          Синоним: "",
          Тип: "ЛюбаяСсылка",
          Формат: "ДФ=dd.MM.yyyy",
          Контроль: ["ОбъектРасширяемойКонфигурации", "Формат"],
        },
        СобственныйРеквизит: {
          Синоним: "",
          Тип: "Строка(20)",
        },
      },
    })

    expect(form).toEqual({
      Комментарий: "Форма расширения",
      Реквизиты: {
        БазовыйОбъект: {
          Заголовок: "",
          Тип: "СправочникОбъект.СправочникПолный",
        },
        СобственныйРеквизитФормы: {
          Заголовок: "",
          Тип: "ЛюбаяСсылка",
        },
      },
      Элементы: {
        СобственноеПоле: {
          Вид: "ПолеВвода",
          Ширина: 10,
        },
        Код: {
          Вид: "ПолеВвода",
          ПутьКДанным: "",
        },
        ПолеБазовогоРеквизита: {
          Вид: "ПолеНадписи",
          ПутьКДанным: "БазовыйОбъект.БазовыйРеквизит.Description",
        },
      },
    })

    expect(yamlText).not.toMatch(/BaseForm|ObjectBelonging|ExtendedConfigurationObject|UUID|ПринадлежностьОбъекта/u)
    expect(yamlText).not.toContain("БазовоеПоле")
    expect(yamlText).not.toContain("БазовыйРеквизитФормы")
    expect(yamlText).not.toContain("UnknownProperty")
    expect(yamlText).not.toContain("FutureState")
    expect(readYaml(
      projectDir,
      "cfe/РасширениеКонтроль/Справочник/СправочникПолный/Формы/ФормаОтчета/БазоваяФорма.yaml",
    )).toMatchObject({
      Элементы: { БазовоеПоле: { Вид: "ПолеВвода", Ширина: 99 } },
    })

    expect(snapshot).toMatchObject({
      specificationVersion: "1.3",
      componentPath: "cfe/РасширениеКонтроль",
      indexGeneration: 1n,
    })
    expect(
      snapshot.entities.find(
        ({ logicalAddress }) => logicalAddress === "Справочник.СправочникПолный.Форма.ФормаОтчета.form"
      )
    ).toMatchObject({
      sourceProjectPath: "Справочник/СправочникПолный/Формы/ФормаОтчета/Форма.yaml",
      xml: { extended: true },
    })
    expect(
      snapshot.entities.every((entity) => snapshot.files.some((file) => file.projectPath === entity.sourceProjectPath))
    ).toBe(true)
    expect(snapshot.entities.filter(({ sourceProjectPath }) => sourceProjectPath.endsWith("БазоваяФорма.yaml")))
      .toEqual(expect.arrayContaining([
        expect.objectContaining({
          logicalAddress: expect.stringContaining(".ОсноваФормы"),
        }),
      ]))
    expect(snapshot).not.toHaveProperty("localIndexes")
    expect(snapshot).not.toHaveProperty("dependencies")
    expect(
      fs.existsSync(join(projectDir, ".nkdk", "components", "cfe", "РасширениеКонтроль", "configuration-index.bin"))
    ).toBe(true)
    expect(fs.existsSync(join(projectDir, ".nkdk", "configuration-index", "default.bin"))).toBe(false)
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
  const validation = await projectState.refreshAndValidate({
    projectDir,
    context: mockContextFromXML(),
    concurrency: 1,
  })
  const validationDiagnostics = [...validation.diagnostics]
  validation.diagnostics.release()
  const importedFormPath = join(
    projectDir,
    "cfe/РасширениеКонтроль/Справочник/СправочникПолный/Формы/ФормаОтчета/Форма.yaml",
  )
  if (!fs.existsSync(importedFormPath)) throw new Error(`Импорт не создал форму: ${JSON.stringify(result)}`)
  const configuration = readYaml(projectDir, "cfe/РасширениеКонтроль/Конфигурация.yaml")
  const catalog = readYaml(projectDir, "cfe/РасширениеКонтроль/Справочник/СправочникПолный/Свойства.yaml")
  const form = readYaml(projectDir, "cfe/РасширениеКонтроль/Справочник/СправочникПолный/Формы/ФормаОтчета/Форма.yaml")
  const formWithoutBase = readYaml(
    projectDir,
    "cfe/РасширениеКонтроль/Справочник/СправочникПолный/Формы/ФормаБезОсновы/Форма.yaml",
  )
  const yamlText = [
    readText(projectDir, "cfe/РасширениеКонтроль/Конфигурация.yaml"),
    readText(projectDir, "cfe/РасширениеКонтроль/Справочник/СправочникПолный/Свойства.yaml"),
    readText(projectDir, "cfe/РасширениеКонтроль/Справочник/СправочникПолный/Формы/ФормаОтчета/Форма.yaml"),
  ].join("\n")
  if (!fs.existsSync(configurationIndexPath(projectDir, {
    kind: "configurationExtension",
    name: "РасширениеКонтроль",
  }))) throw new Error(`Импорт не создал снимок: ${JSON.stringify(result)}`)
  const snapshot = await readConfigurationIndex({
    projectDir,
    address: { kind: "configurationExtension", name: "РасширениеКонтроль" },
  })

  return { projectDir, result, validationDiagnostics, configuration, catalog, form, formWithoutBase, yamlText, snapshot }
}

async function importBaseConfiguration(projectDir: string): Promise<void> {
  const inputDir = temporaryDirectory()
  const configurationPath = join(inputDir, "Configuration.xml")
  fs.copyFileSync(join(configurationFixtureDir, "minimal.xml"), configurationPath)
  replaceExactlyOnce(
    configurationPath,
    "\t\t\t<Name>Конфигурация</Name>",
    "\t\t\t<Name>Конфигурация</Name>\n\t\t\t<DefaultLanguage>Language.БазовыйЯзык</DefaultLanguage>",
  )

  const catalogPath = join(inputDir, "Catalogs", "СправочникПолный.xml")
  fs.mkdirSync(dirname(catalogPath), { recursive: true })
  fs.copyFileSync(join(catalogFixtureDir, "minimal.xml"), catalogPath)
  replaceAllInFile(catalogPath, "ПоУмолчанию", "СправочникПолный")
  replaceExactlyOnce(
    catalogPath,
    "\t\t<ChildObjects/>",
    "\t\t<ChildObjects><Form>ФормаОтчета</Form><Form>ФормаБезОсновы</Form></ChildObjects>",
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
    }
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
        "\t<Attributes>",
        "\t\t<Attribute name=\"БазовыйРеквизитФормы\" id=\"4\">",
        "\t\t\t<Type><v8:Type>xs:dateTime</v8:Type></Type>",
        "\t\t</Attribute>",
        "\t\t<Attribute name=\"БазовыйОбъект\" id=\"5\">",
        "\t\t\t<Type><v8:Type>cfg:CatalogObject.СправочникПолный</v8:Type></Type>",
        "\t\t\t<MainAttribute>true</MainAttribute>",
        "\t\t</Attribute>",
        "\t</Attributes>",
      ].join("\n"),
    )
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
  removeBaseFormElement(join(targetFormDir, "Ext", "Form.xml"))
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

function temporaryDirectory(): string {
  const directory = fs.mkdtempSync(join(os.tmpdir(), "nkdk-extension-import-"))
  temporaryDirectories.push(directory)
  return directory
}

function readYaml(projectDir: string, relativePath: string): unknown {
  return load(readText(projectDir, relativePath))
}

function readText(projectDir: string, relativePath: string): string {
  return fs.readFileSync(join(projectDir, ...relativePath.split("/")), "utf8")
}
