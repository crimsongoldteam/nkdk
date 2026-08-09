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
      succeeded: 3,
      failed: [
        {
          severity: "error",
          code: "project_validation",
          message: "Не найден владелец СправочникОбъект.БазовыйСправочник",
          targetProjectPath: join(
            fs.realpathSync(projectDir),
            "cfe/РасширениеКонтроль/Справочник/БазовыйСправочник/Свойства.yaml",
          ),
        },
        {
          severity: "error",
          code: "project_validation",
          message: 'Ссылка "Language.БазовыйЯзык" не включена в расширение',
          targetProjectPath: "cfe/РасширениеКонтроль/Конфигурация.yaml",
        },
      ],
      warnings: [{
        severity: "warning",
        code: "unresolved_data_path",
        message: "Не удалось преобразовать ПутьКДанным: БазовыйОбъект.БазовыйРеквизит.Description",
        targetProjectPath: "Справочник/СправочникПолный/Формы/ФормаОтчета/Форма.yaml",
        value: "БазовыйОбъект.БазовыйРеквизит.Description",
      }],
      configurationIndexPath: configurationIndexPath(projectDir, {
        kind: "configurationExtension",
        name: "РасширениеКонтроль",
      }),
    })

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
          Тип: "СправочникОбъект.БазовыйСправочник",
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

  it("не сохраняет BaseForm, совпадающую с актуальной проекцией cf", async () => {
    const imported = await importExtension("equal")

    expect(fs.existsSync(baseFormPath(imported.projectDir))).toBe(false)
  })

  it("не создаёт файл и сообщение при отсутствии XML-узла BaseForm", async () => {
    const imported = await importExtension("absent")

    expect(fs.existsSync(baseFormPath(imported.projectDir))).toBe(false)
    expect(JSON.stringify(imported.result)).not.toContain("BaseForm")
  })
})

async function importExtension(baseForm: "different" | "equal" | "absent" = "different") {
  const projectDir = temporaryDirectory()
  const inputDir = temporaryDirectory()
  fs.cpSync(fixtureDir, inputDir, { recursive: true })
  replaceExactlyOnce(
    join(inputDir, "Configuration.xml"),
    "\t\t\t<DefaultRunMode>ManagedApplication</DefaultRunMode>",
    "\t\t\t<ConfigurationExtensionCompatibilityMode>Version8_3_20</ConfigurationExtensionCompatibilityMode>\n" +
      "\t\t\t<DefaultRunMode>ManagedApplication</DefaultRunMode>"
  )
  const formPath = join(inputDir, "Catalogs", "СправочникПолный", "Forms", "ФормаОтчета", "Ext", "Form.xml")
  if (baseForm === "equal") {
    replaceExactlyOnce(formPath, "\n\t\t\t\t<Width>99</Width>", "")
    replaceExactlyOnce(
      formPath,
      [
        "\n\t\t<Attributes>",
        "\n\t\t\t<Attribute name=\"БазовыйРеквизитФормы\" id=\"4\">",
        "\n\t\t\t\t<Type>",
        "\n\t\t\t\t\t<v8:Type>xs:dateTime</v8:Type>",
        "\n\t\t\t\t</Type>",
        "\n\t\t\t</Attribute>",
        "\n\t\t</Attributes>",
      ].join(""),
      "\n\t\t<Attributes/>",
    )
  } else if (baseForm === "absent") {
    removeBaseForm(formPath)
  }
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
  writeBaseLanguage(projectDir)
  writeBaseCatalog(projectDir)
  writeBaseForm(projectDir)
  writeBaseConfiguration(projectDir)

  const result = await importConfigurationFromXml({
    context: mockContextFromXML(),
    inputDir,
    projectDir,
    concurrency: 1,
    operationId: "configuration-extension-e2e",
    xmlImportWorkerPoolHandle,
    projectState,
  })
  const configuration = readYaml(projectDir, "cfe/РасширениеКонтроль/Конфигурация.yaml")
  const catalog = readYaml(projectDir, "cfe/РасширениеКонтроль/Справочник/СправочникПолный/Свойства.yaml")
  const form = readYaml(projectDir, "cfe/РасширениеКонтроль/Справочник/СправочникПолный/Формы/ФормаОтчета/Форма.yaml")
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

  return { projectDir, result, configuration, catalog, form, yamlText, snapshot }
}

function removeBaseForm(path: string): void {
  const content = fs.readFileSync(path, "utf8")
  const next = content.replace(/\n\t<BaseForm[\s\S]*?<\/BaseForm>/u, "")
  if (next === content) throw new Error(`Не найден BaseForm в ${path}`)
  fs.writeFileSync(path, next)
}

function baseFormPath(projectDir: string): string {
  return join(
    projectDir,
    "cfe",
    "РасширениеКонтроль",
    "Справочник",
    "СправочникПолный",
    "Формы",
    "ФормаОтчета",
    "БазоваяФорма.yaml",
  )
}

function replaceExactlyOnce(path: string, source: string, replacement: string): void {
  const content = fs.readFileSync(path, "utf8")
  const first = content.indexOf(source)
  if (first === -1 || content.indexOf(source, first + source.length) !== -1) {
    throw new Error(`Ожидалось ровно одно вхождение в ${path}: ${source}`)
  }
  fs.writeFileSync(path, content.slice(0, first) + replacement + content.slice(first + source.length))
}

function temporaryDirectory(): string {
  const directory = fs.mkdtempSync(join(os.tmpdir(), "nkdk-extension-import-"))
  temporaryDirectories.push(directory)
  return directory
}

function writeBaseLanguage(projectDir: string): void {
  const path = join(projectDir, "cf", "Язык", "БазовыйЯзык", "Свойства.yaml")
  fs.mkdirSync(dirname(path), { recursive: true })
  fs.writeFileSync(path, "КодЯзыка: ru\n")
}

function writeBaseConfiguration(projectDir: string): void {
  const path = join(projectDir, "cf", "Конфигурация.yaml")
  fs.mkdirSync(dirname(path), { recursive: true })
  fs.writeFileSync(path, "Имя: Основная\nОсновнойЯзык: БазовыйЯзык\n")
}

function writeBaseCatalog(projectDir: string): void {
  const path = join(projectDir, "cf", "Справочник", "БазовыйСправочник", "Свойства.yaml")
  fs.mkdirSync(dirname(path), { recursive: true })
  fs.writeFileSync(path, ["Реквизиты:", "  БазовыйРеквизит:", "    Тип: Справочник.БазовыйСправочник", ""].join("\n"))
}

function writeBaseForm(projectDir: string): void {
  const path = join(
    projectDir,
    "cf",
    "Справочник",
    "СправочникПолный",
    "Формы",
    "ФормаОтчета",
    "Форма.yaml",
  )
  fs.mkdirSync(dirname(path), { recursive: true })
  fs.writeFileSync(path, [
    "Элементы:",
    "  БазовоеПоле:",
    "    Вид: ПолеВвода",
    "",
  ].join("\n"))
}

function readYaml(projectDir: string, relativePath: string): unknown {
  return load(readText(projectDir, relativePath))
}

function readText(projectDir: string, relativePath: string): string {
  return fs.readFileSync(join(projectDir, ...relativePath.split("/")), "utf8")
}
