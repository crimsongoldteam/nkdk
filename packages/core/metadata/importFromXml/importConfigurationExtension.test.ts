import fs from "node:fs"
import os from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { load } from "js-yaml"
import { configurationIndexPath, importConfigurationFromXml, readConfigurationIndex } from "../../index"
import { mockContextFromXML } from "../../tests/mockContext"
import { createPreparedYamlWorkerThreadPoolFactory } from "../../tests/preparedYamlWorkerTestPool"
import { createXmlImportWorkerTestPool } from "../../tests/xmlImportWorkerTestPool"

const fixtureDir = join(dirname(fileURLToPath(import.meta.url)), "__fixtures__", "configurationExtension")
const temporaryDirectories: string[] = []
const xmlImportWorkerPoolHandle = createXmlImportWorkerTestPool()
let importedExtension: Awaited<ReturnType<typeof importExtension>>

afterAll(async () => {
  await xmlImportWorkerPoolHandle.close()
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
      failed: [],
      warnings: [],
      configurationIndexPath: configurationIndexPath(projectDir, {
        kind: "configurationExtension",
        name: "РасширениеКонтроль",
      }),
    })

    expect(configuration).toEqual({
      Имя: "РасширениеКонтроль",
      НазначениеРасширенияКонфигурации: "Адаптация",
      ОсновнойРежимЗапуска: "УправляемоеПриложение",
      ОсновнойЯзык: "БазовыйЯзык",
      Контроль: ["ОсновнойРежимЗапуска"],
    })

    expect(catalog).toEqual({
      Реквизиты: {
        РеквизитСправочника: {
          Синоним: "",
          Тип: "Дата",
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
          Тип: "Строка",
        },
      },
      Элементы: {
        СобственноеПоле: {
          Вид: "ПолеВвода",
          Ширина: 10,
        },
        ПолеБазовогоРеквизита: {
          Вид: "ПолеНадписи",
          ПутьКДанным: "БазовыйОбъект.БазовыйРеквизит.Наименование",
        },
      },
    })

    expect(yamlText).not.toMatch(/BaseForm|ObjectBelonging|ExtendedConfigurationObject|UUID|ПринадлежностьОбъекта/u)
    expect(yamlText).not.toContain("БазовоеПоле")
    expect(yamlText).not.toContain("БазовыйРеквизитФормы")
    expect(yamlText).not.toContain("UnknownProperty")
    expect(yamlText).not.toContain("FutureState")

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
    expect(snapshot).not.toHaveProperty("localIndexes")
    expect(snapshot).not.toHaveProperty("dependencies")
    expect(
      fs.existsSync(join(projectDir, ".nkdk", "components", "cfe", "РасширениеКонтроль", "configuration-index.bin"))
    ).toBe(true)
    expect(fs.existsSync(join(projectDir, ".nkdk", "configuration-index", "default.bin"))).toBe(false)
  })
})

async function importExtension() {
  const projectDir = temporaryDirectory()
  writeBaseLanguage(projectDir)
  writeBaseCatalog(projectDir)

  const result = await importConfigurationFromXml({
    context: mockContextFromXML(),
    inputDir: fixtureDir,
    projectDir,
    concurrency: 1,
    operationId: "configuration-extension-e2e",
    xmlImportWorkerPoolHandle,
    createReferenceWorkerPool: createPreparedYamlWorkerThreadPoolFactory(),
  })
  const configuration = readYaml(projectDir, "cfe/РасширениеКонтроль/Конфигурация.yaml")
  const catalog = readYaml(projectDir, "cfe/РасширениеКонтроль/Справочник/СправочникПолный/Свойства.yaml")
  const form = readYaml(projectDir, "cfe/РасширениеКонтроль/Справочник/СправочникПолный/Формы/ФормаОтчета/Форма.yaml")
  const yamlText = [
    readText(projectDir, "cfe/РасширениеКонтроль/Конфигурация.yaml"),
    readText(projectDir, "cfe/РасширениеКонтроль/Справочник/СправочникПолный/Свойства.yaml"),
    readText(projectDir, "cfe/РасширениеКонтроль/Справочник/СправочникПолный/Формы/ФормаОтчета/Форма.yaml"),
  ].join("\n")
  const snapshot = await readConfigurationIndex({
    projectDir,
    address: { kind: "configurationExtension", name: "РасширениеКонтроль" },
  })

  return { projectDir, result, configuration, catalog, form, yamlText, snapshot }
}

function temporaryDirectory(): string {
  const directory = fs.mkdtempSync(join(os.tmpdir(), "nkdk-extension-import-"))
  temporaryDirectories.push(directory)
  return directory
}

function writeBaseLanguage(projectDir: string): void {
  const path = join(projectDir, "cf", "Язык", "БазовыйЯзык.yaml")
  fs.mkdirSync(dirname(path), { recursive: true })
  fs.writeFileSync(path, "КодЯзыка: ru\n")
}

function writeBaseCatalog(projectDir: string): void {
  const path = join(projectDir, "cf", "Справочник", "БазовыйСправочник", "Свойства.yaml")
  fs.mkdirSync(dirname(path), { recursive: true })
  fs.writeFileSync(path, ["Реквизиты:", "  БазовыйРеквизит:", "    Тип: Справочник.БазовыйСправочник", ""].join("\n"))
}

function readYaml(projectDir: string, relativePath: string): unknown {
  return load(readText(projectDir, relativePath))
}

function readText(projectDir: string, relativePath: string): string {
  return fs.readFileSync(join(projectDir, ...relativePath.split("/")), "utf8")
}
