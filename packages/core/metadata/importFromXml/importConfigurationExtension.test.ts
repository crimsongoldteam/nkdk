import fs from "node:fs"
import os from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { afterEach, describe, expect, it } from "vitest"
import { load } from "js-yaml"
import {
  configurationIndexPath,
  importConfigurationFromXml,
  readConfigurationIndex,
} from "../../index"
import { mockContextFromXML } from "../../tests/mockContext"

const fixtureDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "__fixtures__",
  "configurationExtension"
)
const temporaryDirectories: string[] = []

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    fs.rmSync(directory, { recursive: true, force: true })
  }
})

describe("configuration extension XML import", () => {
  it("imports extension controls, own children and an extended form through the public API", async () => {
    const projectDir = temporaryDirectory()
    writeBaseLanguage(projectDir)
    writeBaseCatalog(projectDir)

    const result = await importConfigurationFromXml({
      context: mockContextFromXML(),
      inputDir: fixtureDir,
      projectDir,
      concurrency: 1,
      operationId: "configuration-extension-e2e",
    })

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

    const configuration = readYaml(
      projectDir,
      "cfe/РасширениеКонтроль/Конфигурация.yaml"
    )
    expect(configuration).toEqual({
      Имя: "РасширениеКонтроль",
      НазначениеРасширенияКонфигурации: "Адаптация",
      ОсновнойРежимЗапуска: "УправляемоеПриложение",
      ОсновнойЯзык: "БазовыйЯзык",
      Контроль: ["ОсновнойРежимЗапуска"],
    })

    const catalog = readYaml(
      projectDir,
      "cfe/РасширениеКонтроль/Справочник/СправочникПолный/Свойства.yaml"
    )
    expect(catalog).toEqual({
      Реквизиты: {
        РеквизитСправочника: {
          Тип: "Дата",
          Формат: "ДФ=dd.MM.yyyy",
          Контроль: ["ОбъектРасширяемойКонфигурации", "Формат"],
        },
        СобственныйРеквизит: {
          Тип: "Строка(20)",
        },
      },
    })

    const form = readYaml(
      projectDir,
      "cfe/РасширениеКонтроль/Справочник/СправочникПолный/Формы/ФормаОтчета/Форма.yaml"
    )
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

    const yamlText = [
      readText(projectDir, "cfe/РасширениеКонтроль/Конфигурация.yaml"),
      readText(
        projectDir,
        "cfe/РасширениеКонтроль/Справочник/СправочникПолный/Свойства.yaml"
      ),
      readText(
        projectDir,
        "cfe/РасширениеКонтроль/Справочник/СправочникПолный/Формы/ФормаОтчета/Форма.yaml"
      ),
    ].join("\n")
    expect(yamlText).not.toMatch(
      /BaseForm|ObjectBelonging|ExtendedConfigurationObject|UUID|ПринадлежностьОбъекта/u
    )
    expect(yamlText).not.toContain("БазовоеПоле")
    expect(yamlText).not.toContain("БазовыйРеквизитФормы")
    expect(yamlText).not.toContain("UnknownProperty")
    expect(yamlText).not.toContain("FutureState")

    const snapshot = await readConfigurationIndex({
      projectDir,
      address: { kind: "configurationExtension", name: "РасширениеКонтроль" },
    })
    expect(snapshot.binding.componentPath).toBe("cfe/РасширениеКонтроль")
    expect(snapshot.xmlValues).toContainEqual({
      logicalAddress: "Справочник.СправочникПолный.Форма.ФормаОтчета.form",
      extended: true,
    })
    expect(
      fs.existsSync(
        join(projectDir, ".nkdk", "components", "cfe", "РасширениеКонтроль", "configuration-index.bin")
      )
    ).toBe(true)
    expect(fs.existsSync(join(projectDir, ".nkdk", "configuration-index", "default.bin"))).toBe(false)
  })
})

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
  const path = join(
    projectDir,
    "cf",
    "Справочник",
    "БазовыйСправочник",
    "Свойства.yaml"
  )
  fs.mkdirSync(dirname(path), { recursive: true })
  fs.writeFileSync(
    path,
    [
      "Реквизиты:",
      "  БазовыйРеквизит:",
      "    Тип: Справочник.БазовыйСправочник",
      "",
    ].join("\n")
  )
}

function readYaml(projectDir: string, relativePath: string): unknown {
  return load(readText(projectDir, relativePath))
}

function readText(projectDir: string, relativePath: string): string {
  return fs.readFileSync(join(projectDir, ...relativePath.split("/")), "utf8")
}
