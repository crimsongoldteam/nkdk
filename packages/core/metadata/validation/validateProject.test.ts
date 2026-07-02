import fs, { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join, resolve } from "path"
import { TypeCompiler } from "@sinclair/typebox/compiler"
import { afterEach, describe, expect, it, vi } from "vitest"
import { TopLevelMetadataItemRules } from "~/metadata/appliedObjects/configuration/topLevelRules"
import { mockContext } from "~/tests/mockContext"
import { ProjectFileSchemaError } from "./projectFileSchema"
import {
  getProjectValidationReadCountForTests,
  resetProjectValidationReadCountForTests,
} from "./projectValidationPasses"
import { validateProject } from "./validateProject"

describe("validateProject", { timeout: 30_000 }, () => {
  const tempDirs: string[] = []

  afterEach(() => {
    vi.restoreAllMocks()
    for (const dir of tempDirs.splice(0)) {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it("returns a Promise from the public validateProject API", async () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", "{}\n")

    const result = validateProject({ projectDir, context: mockContext })

    expect(result).toBeInstanceOf(Promise)
    await expect(result).resolves.toEqual({ diagnostics: [] })
  })

  it("validates all supported project files and sorts diagnostics", async () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Справочник/АОшибочный/Свойства.yaml", ['НесуществующееПоле: "лишнее поле"'])
    writeProjectFile(projectDir, "Справочник/ЯФорма/Свойства.yaml", ["Комментарий: владелец формы"])
    writeProjectFile(projectDir, "Справочник/ЯФорма/Формы/ФормаЭлемента/Форма.yaml", [
      "Элементы:",
      "  Поле:",
      "    Вид: ПолеВвода",
      "    ПутьКДанным: Неизвестный",
    ])

    const diagnostics = (await validateProject({ projectDir, context: mockContext })).diagnostics

    expect(diagnostics.map((diagnostic) => diagnostic.filePath)).toEqual([
      join(projectDir, "Справочник", "АОшибочный", "Свойства.yaml"),
      join(projectDir, "Справочник", "ЯФорма", "Формы", "ФормаЭлемента", "Форма.yaml"),
    ])
    expect(diagnostics[0]).toMatchObject({ source: "structure", severity: "error" })
    expect(diagnostics[1]?.message).toContain('ПутьКДанным "Неизвестный"')
  })

  it("validates a single form with schema and DataPath rules", async () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", "")
    writeProjectFile(projectDir, "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml", [
      "ЛишнееПоле: true",
      "Элементы:",
      "  Поле:",
      "    Вид: ПолеВвода",
      "    ПутьКДанным: Неизвестный",
    ])

    const diagnostics = (await validateProject({
      projectDir,
      filePath: "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml",
      context: mockContext,
    })).diagnostics

    expect(diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ source: "structure", severity: "error", path: "/ЛишнееПоле" }),
        expect.objectContaining({
          source: "structure",
          severity: "error",
          message: expect.stringContaining('ПутьКДанным "Неизвестный"'),
        }),
      ])
    )
  }, 30_000)

  it("concurrency 1 keeps existing project diagnostics", async () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", [
      "Реквизиты:",
      "  Товар:",
      "    Тип: Справочник.Номенклатура",
    ])
    writeProjectFile(projectDir, "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml", [
      "Реквизиты:",
      "  Объект:",
      "    Тип: СправочникОбъект.Товары",
      "Элементы:",
      "  Поле:",
      "    Вид: ПолеВвода",
      "    ПутьКДанным: Объект.НетТакогоРеквизита",
    ])

    const result = await validateProject({ projectDir, context: mockContext, concurrency: 1 })

    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        filePath: expect.stringContaining("Форма.yaml"),
        message: 'ПутьКДанным "Объект.НетТакогоРеквизита": неизвестный реквизит "НетТакогоРеквизита"',
      }),
    ])
  })

  it("parallel full validation returns the same diagnostics as concurrency 1", async () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", [
      "Реквизиты:",
      "  Товар:",
      "    Тип: Справочник.Номенклатура",
    ])
    writeProjectFile(projectDir, "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml", [
      "Реквизиты:",
      "  Объект:",
      "    Тип: СправочникОбъект.Товары",
      "Элементы:",
      "  Поле:",
      "    Вид: ПолеВвода",
      "    ПутьКДанным: Объект.НетТакогоРеквизита",
    ])

    const sequential = await validateProject({ projectDir, context: mockContext, concurrency: 1 })
    const parallel = await validateProject({ projectDir, context: mockContext, concurrency: 2 })

    expect(parallel.diagnostics).toEqual(sequential.diagnostics)
  })

  it("warns about unimplemented dynamic list type-value checks instead of failing form import", async () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", "")
    writeProjectFile(projectDir, "Справочник/Товары/Формы/ФормаСписка/Форма.yaml", [
      "Реквизиты:",
      "  Список:",
      "    Тип: ДинамическийСписок",
      "    ОсновнойРеквизит: Истина",
      "    ДинамическийСписок:",
      "      УсловноеОформление:",
      "        Элементы:",
      "          - Поля:",
      "              - Тип",
      "            Отбор:",
      "              Элементы:",
      "                - ЛевоеЗначение: .Тип",
      "                  ПравоеЗначение: Документ.ПоступлениеБезналичныхДенежныхСредств",
      "            Оформление:",
      "              Текст: '\"Поступление\"'",
      "Элементы:",
      "  Список:",
      "    Вид: ТаблицаФормы",
      "    ПутьКДанным: Список",
    ])

    const diagnostics = (await validateProject({
      projectDir,
      filePath: "Справочник/Товары/Формы/ФормаСписка/Форма.yaml",
      context: mockContext,
    })).diagnostics

    expect(diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: "structure",
          severity: "warning",
          path: "/Реквизиты/Список/ДинамическийСписок/УсловноеОформление/Элементы/0/Отбор/Элементы/0/ПравоеЗначение",
          message:
            'Проверка значения типа "Документ.ПоступлениеБезналичныхДенежныхСредств" в условном оформлении динамического списка пока не реализована и будет добавлена в будущих версиях',
        }),
      ])
    )
    expect(diagnostics.map((diagnostic) => diagnostic.message)).not.toEqual(
      expect.arrayContaining([expect.stringContaining("Не удалось импортировать форму")])
    )
  }, 30_000)

  it("does not add a form import diagnostic when schema errors already explain the invalid form shape", async () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", "")
    writeProjectFile(projectDir, "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml", ["Элементы: []"])

    const diagnostics = (await validateProject({
      projectDir,
      filePath: "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml",
      context: mockContext,
    })).diagnostics

    expect(diagnostics).toEqual(
      expect.arrayContaining([expect.objectContaining({ source: "structure", severity: "error", path: "/Элементы" })])
    )
    expect(diagnostics.map((diagnostic) => diagnostic.message)).not.toEqual(
      expect.arrayContaining([expect.stringContaining("Не удалось импортировать форму")])
    )
  })

  it("validates a single properties file without validating sibling forms", async () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", [
      "Реквизиты:",
      "  ОбщееИмя:",
      "    Тип: Строка",
      "ТабличныеЧасти:",
      "  ОбщееИмя:",
      "    Реквизиты: {}",
    ])
    writeProjectFile(projectDir, "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml", [
      "Элементы:",
      "  Поле:",
      "    Вид: ПолеВвода",
      "    ПутьКДанным: Неизвестный",
    ])

    const diagnostics = (await validateProject({
      projectDir,
      filePath: "Справочник/Товары/Свойства.yaml",
      context: mockContext,
    })).diagnostics

    expect(diagnostics).toHaveLength(1)
    expect(diagnostics[0]).toMatchObject({
      filePath: join(projectDir, "Справочник", "Товары", "Свойства.yaml"),
      path: "/ТабличныеЧасти/ОбщееИмя",
      source: "structure",
      severity: "error",
    })
  })

  it("validates every top-level metadata object with YAML directory", async () => {
    const projectDir = createProject()

    for (const dir of topLevelYamlDirs()) {
      const content = minimalTopLevelPropertiesYAML(dir)
      writeProjectFile(projectDir, `${dir}/Тест/Свойства.yaml`, content)
    }

    const diagnostics = (await validateProject({ projectDir, context: mockContext })).diagnostics

    expect(diagnostics).toEqual([])
  })

  it("accepts an empty properties YAML file as an empty object", async () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Справочник/Договоры/Свойства.yaml", "")

    const diagnostics = (await validateProject({
      projectDir,
      filePath: "Справочник/Договоры/Свойства.yaml",
      context: mockContext,
    })).diagnostics

    expect(diagnostics).toEqual([])
  })

  it("keeps an empty root configuration YAML invalid because Имя is required", async () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Конфигурация.yaml", "")

    const diagnostics = (await validateProject({
      projectDir,
      filePath: "Конфигурация.yaml",
      context: mockContext,
    })).diagnostics

    expect(diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          filePath: join(projectDir, "Конфигурация.yaml"),
          source: "structure",
          severity: "error",
        }),
      ])
    )
  })

  it("rejects an explicit object synonym equal to the object name", async () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Справочник/КакоеТоПоле/Свойства.yaml", ["Синоним: Какое то поле"])

    const diagnostics = (await validateProject({
      projectDir,
      filePath: "Справочник/КакоеТоПоле/Свойства.yaml",
      context: mockContext,
    })).diagnostics

    expect(diagnostics).toEqual([
      expect.objectContaining({
        filePath: join(projectDir, "Справочник", "КакоеТоПоле", "Свойства.yaml"),
        source: "structure",
        severity: "error",
        path: "/Синоним",
        message: expect.stringContaining('Поле "Синоним" не нужно указывать'),
      }),
    ])
  })

  it("rejects an explicit information register synonym equal to the register name", async () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "РегистрСведений/ЗадачиУниверсальныхПроцессов/Свойства.yaml", [
      "Синоним: Задачи универсальных процессов",
    ])

    const diagnostics = (await validateProject({
      projectDir,
      filePath: "РегистрСведений/ЗадачиУниверсальныхПроцессов/Свойства.yaml",
      context: mockContext,
    })).diagnostics

    expect(diagnostics).toEqual([
      expect.objectContaining({
        filePath: join(projectDir, "РегистрСведений", "ЗадачиУниверсальныхПроцессов", "Свойства.yaml"),
        source: "structure",
        severity: "error",
        path: "/Синоним",
        message: expect.stringContaining('Поле "Синоним" не нужно указывать'),
      }),
    ])
  })

  it("allows only non-default languages when the default synonym equals the object name", async () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Справочник/КакоеТоПоле/Свойства.yaml", ["Синоним:", "  en: Some field"])

    const diagnostics = (await validateProject({
      projectDir,
      filePath: "Справочник/КакоеТоПоле/Свойства.yaml",
      context: mockContext,
    })).diagnostics

    expect(diagnostics).toEqual([])
  })

  it("rejects only the default language when a multilingual synonym equals the object name", async () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Справочник/КакоеТоПоле/Свойства.yaml", [
      "Синоним:",
      "  ru: Какое то поле",
      "  en: Some field",
    ])

    const diagnostics = (await validateProject({
      projectDir,
      filePath: "Справочник/КакоеТоПоле/Свойства.yaml",
      context: mockContext,
    })).diagnostics

    expect(diagnostics).toEqual([
      expect.objectContaining({
        path: "/Синоним/ru",
      }),
    ])
  })

  it("rejects a configuration synonym equal to the required configuration name", async () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Конфигурация.yaml", [
      "Имя: КакоеТоПоле",
      "Синоним: Какое то поле",
      "ОсновнойЯзык: Русский",
    ])
    writeProjectFile(projectDir, "Язык/Русский/Свойства.yaml", ["КодЯзыка: ru"])

    const diagnostics = (await validateProject({
      projectDir,
      filePath: "Конфигурация.yaml",
      context: mockContext,
    })).diagnostics

    expect(diagnostics).toEqual([
      expect.objectContaining({
        filePath: join(projectDir, "Конфигурация.yaml"),
        source: "structure",
        severity: "error",
        path: "/Синоним",
      }),
    ])
  })

  it("rejects a nested form attribute title equal to the attribute name", async () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", "")
    writeProjectFile(projectDir, "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml", [
      "Реквизиты:",
      "  КакоеТоПоле:",
      "    Заголовок: Какое то поле",
    ])

    const diagnostics = (await validateProject({
      projectDir,
      filePath: "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml",
      context: mockContext,
    })).diagnostics

    expect(diagnostics).toEqual([
      expect.objectContaining({
        filePath: join(projectDir, "Справочник", "Товары", "Формы", "ФормаЭлемента", "Форма.yaml"),
        source: "structure",
        severity: "error",
        path: "/Реквизиты/КакоеТоПоле/Заголовок",
        message: expect.stringContaining('Поле "Заголовок" не нужно указывать'),
      }),
    ])
  })

  it("rejects explicit document implicit YAML boolean value", async () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Документ/ПоступлениеТоваровУслуг/Свойства.yaml", ["Автонумерация: Истина"])

    const diagnostics = (await validateProject({
      projectDir,
      filePath: "Документ/ПоступлениеТоваровУслуг/Свойства.yaml",
      context: mockContext,
    })).diagnostics

    expect(diagnostics).toEqual([
      expect.objectContaining({
        filePath: join(projectDir, "Документ", "ПоступлениеТоваровУслуг", "Свойства.yaml"),
        path: "/Автонумерация",
        source: "structure",
        severity: "error",
      }),
    ])
  })

  it("accepts explicit document non-implicit YAML boolean value", async () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Документ/ПоступлениеТоваровУслуг/Свойства.yaml", ["Автонумерация: Ложь"])

    const diagnostics = (await validateProject({
      projectDir,
      filePath: "Документ/ПоступлениеТоваровУслуг/Свойства.yaml",
      context: mockContext,
    })).diagnostics

    expect(diagnostics).toEqual([])
  })

  it("rejects non-canonical document attribute reference type names", async () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Документ/Заказ/Свойства.yaml", [
      "Реквизиты:",
      "  Контрагент:",
      "    Тип: СправочникСсылка.Контрагенты",
      "ТабличныеЧасти:",
      "  Товары:",
      "    Реквизиты:",
      "      Номенклатура:",
      "        Тип: СправочникСсылка.Номенклатура",
    ])

    const diagnostics = (await validateProject({
      projectDir,
      filePath: "Документ/Заказ/Свойства.yaml",
      context: mockContext,
    })).diagnostics

    expect(diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          filePath: join(projectDir, "Документ", "Заказ", "Свойства.yaml"),
          path: "/Реквизиты/Контрагент/Тип",
          source: "structure",
          severity: "error",
        }),
        expect.objectContaining({
          filePath: join(projectDir, "Документ", "Заказ", "Свойства.yaml"),
          path: "/ТабличныеЧасти/Товары/Реквизиты/Номенклатура/Тип",
          source: "structure",
          severity: "error",
        }),
      ])
    )
  })

  it("accepts canonical document attribute reference type names", async () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Документ/Заказ/Свойства.yaml", [
      "Реквизиты:",
      "  Контрагент:",
      "    Тип: Справочник.Контрагенты",
      "ТабличныеЧасти:",
      "  Товары:",
      "    Реквизиты:",
      "      Номенклатура:",
      "        Тип: Справочник.Номенклатура",
    ])

    const diagnostics = (await validateProject({
      projectDir,
      filePath: "Документ/Заказ/Свойства.yaml",
      context: mockContext,
    })).diagnostics

    expect(diagnostics).toEqual([])
  })

  it("rejects non-canonical chart of characteristic types attribute reference type names", async () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "ПланВидовХарактеристик/ВидыСубконто/Свойства.yaml", [
      "Реквизиты:",
      "  Контрагент:",
      "    Тип: СправочникСсылка.Контрагенты",
      "ТабличныеЧасти:",
      "  Значения:",
      "    Реквизиты:",
      "      Номенклатура:",
      "        Тип: СправочникСсылка.Номенклатура",
    ])

    const diagnostics = (await validateProject({
      projectDir,
      filePath: "ПланВидовХарактеристик/ВидыСубконто/Свойства.yaml",
      context: mockContext,
    })).diagnostics

    expect(diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          filePath: join(projectDir, "ПланВидовХарактеристик", "ВидыСубконто", "Свойства.yaml"),
          path: "/Реквизиты/Контрагент/Тип",
          source: "structure",
          severity: "error",
        }),
        expect.objectContaining({
          filePath: join(projectDir, "ПланВидовХарактеристик", "ВидыСубконто", "Свойства.yaml"),
          path: "/ТабличныеЧасти/Значения/Реквизиты/Номенклатура/Тип",
          source: "structure",
          severity: "error",
        }),
      ])
    )
  })

  it("validates nested subsystem properties with schema rules", async () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Подсистема/Администрирование/Свойства.yaml", "{}\n")
    writeProjectFile(projectDir, "Подсистема/Администрирование/Подсистемы/Настройки/Свойства.yaml", [
      "ЛишнееПоле: true",
    ])

    const diagnostics = (await validateProject({ projectDir, context: mockContext })).diagnostics

    expect(diagnostics).toEqual([
      expect.objectContaining({
        filePath: join(projectDir, "Подсистема", "Администрирование", "Подсистемы", "Настройки", "Свойства.yaml"),
        source: "structure",
        severity: "error",
        path: "/ЛишнееПоле",
      }),
    ])
  })

  it("validates the root configuration YAML file", async () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Конфигурация.yaml", ["Имя: Конфигурация", "ОсновнойЯзык: НеСуществует"])

    const diagnostics = (await validateProject({ projectDir, context: mockContext })).diagnostics

    expect(diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          filePath: join(projectDir, "Язык", "НеСуществует", "Свойства.yaml"),
          source: "reference",
          severity: "error",
          message: 'Не найден объект "Язык.НеСуществует"',
        }),
      ])
    )
  })

  it("requires the root configuration default language in YAML", async () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Конфигурация.yaml", ["Имя: Конфигурация"])

    const diagnostics = (await validateProject({ projectDir, context: mockContext })).diagnostics

    expect(diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          filePath: join(projectDir, "Конфигурация.yaml"),
          source: "structure",
          severity: "error",
          path: "/ОсновнойЯзык",
          message: 'Отсутствует обязательное свойство "ОсновнойЯзык"',
        }),
      ])
    )
  })

  it("accepts a short root configuration default language reference", async () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Конфигурация.yaml", ["Имя: Конфигурация", "ОсновнойЯзык: Русский"])
    writeProjectFile(projectDir, "Язык/Русский/Свойства.yaml", ["Комментарий: язык конфигурации", "КодЯзыка: ru"])

    const diagnostics = (await validateProject({ projectDir, context: mockContext })).diagnostics

    expect(diagnostics).toEqual([])
  })

  it("requires language code in language YAML", async () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Конфигурация.yaml", ["Имя: Конфигурация", "ОсновнойЯзык: Русский"])
    writeProjectFile(projectDir, "Язык/Русский/Свойства.yaml", ["Синоним: Русский"])

    const diagnostics = (await validateProject({ projectDir, context: mockContext })).diagnostics

    expect(diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          filePath: join(projectDir, "Язык", "Русский", "Свойства.yaml"),
          source: "structure",
          severity: "error",
          path: "/КодЯзыка",
          message: 'Отсутствует обязательное свойство "КодЯзыка"',
        }),
      ])
    )
  })

  it("rejects a full root configuration default language reference", async () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Конфигурация.yaml", ["Имя: Конфигурация", "ОсновнойЯзык: Язык.Русский"])
    writeProjectFile(projectDir, "Язык/Русский/Свойства.yaml", ["Комментарий: язык конфигурации", "КодЯзыка: ru"])

    const diagnostics = (await validateProject({ projectDir, context: mockContext })).diagnostics

    expect(diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          filePath: join(projectDir, "Конфигурация.yaml"),
          source: "structure",
          severity: "error",
          path: "/ОсновнойЯзык",
        }),
      ])
    )
  })

  it("reports a missing short root configuration default language target", async () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Конфигурация.yaml", ["Имя: Конфигурация", "ОсновнойЯзык: Русский"])

    const diagnostics = (await validateProject({ projectDir, context: mockContext })).diagnostics

    expect(diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          filePath: join(projectDir, "Язык", "Русский", "Свойства.yaml"),
          source: "reference",
          severity: "error",
          message: 'Не найден объект "Язык.Русский"',
        }),
      ])
    )
  })

  it("validates a single root configuration file", async () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Конфигурация.yaml", ["Имя: Конфигурация", "ОсновнойЯзык: НеСуществует"])
    writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", ['НесуществующееПоле: "лишнее поле"'])

    const diagnostics = (await validateProject({
      projectDir,
      filePath: "Конфигурация.yaml",
      context: mockContext,
    })).diagnostics

    expect(diagnostics).toHaveLength(1)
    expect(diagnostics[0]).toMatchObject({
      filePath: join(projectDir, "Язык", "НеСуществует", "Свойства.yaml"),
      message: 'Не найден объект "Язык.НеСуществует"',
    })
  })

  it("accepts SystemEnumeration properties in catalog attributes and standard attributes", async () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Справочник/Файлы/Свойства.yaml", [
      "Реквизиты:",
      "  Автор:",
      "    Тип: Справочник.Пользователи",
      "    ПроверкаЗаполнения: ВыдаватьОшибку",
      "    Индексирование: Индексировать",
      "    ПолнотекстовыйПоиск: НеИспользовать",
      "СтандартныеРеквизиты:",
      "  Владелец:",
      "    ПроверкаЗаполнения: ВыдаватьОшибку",
      "    РежимСокращенияТипа: Запрещать",
      "  Наименование:",
      "    ПроверкаЗаполнения: ВыдаватьОшибку",
    ])

    const diagnostics = (await validateProject({
      projectDir,
      filePath: "Справочник/Файлы/Свойства.yaml",
      context: mockContext,
    })).diagnostics

    expect(diagnostics).toEqual([])
  })

  it("throws ProjectFileSchemaError for an unsupported single file inside the project", async () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Справочник/Товары/Команды/Команда.yaml", "Имя: Тест\n")

    await expect(
      validateProject({
        projectDir,
        filePath: "Справочник/Товары/Команды/Команда.yaml",
        context: mockContext,
      })
    ).rejects.toThrow(ProjectFileSchemaError)
  })

  it("uses one YAML cache for repeated owner reads", async () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Справочник/Номенклатура/Свойства.yaml", ["Реквизиты:", "  Артикул: Строка"])
    writeProjectFile(projectDir, "Справочник/Номенклатура/Формы/ФормаЭлемента/Форма.yaml", [
      "Реквизиты:",
      "  Объект: Справочник.Номенклатура",
      "Элементы:",
      "  Артикул:",
      "    Вид: ПолеВвода",
      "    ПутьКДанным: Объект.Артикул",
      "  ЕщеАртикул:",
      "    Вид: ПолеВвода",
      "    ПутьКДанным: Объект.Артикул",
    ])
    const readFileSync = vi.spyOn(fs, "readFileSync")

    await validateProject({ projectDir, context: mockContext, concurrency: 1 })

    const ownerPath = join(projectDir, "Справочник", "Номенклатура", "Свойства.yaml")
    expect(readFileSync.mock.calls.filter(([filePath]) => filePath === ownerPath)).toHaveLength(1)
  })

  it("does not read a YAML file twice during full validation", async () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", "{}\n")
    writeProjectFile(projectDir, "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml", "Элементы: {}\n")

    resetProjectValidationReadCountForTests()
    await validateProject({ projectDir, context: mockContext, concurrency: 1 })

    expect(getProjectValidationReadCountForTests(join(projectDir, "Справочник", "Товары", "Свойства.yaml"))).toBe(1)
    expect(
      getProjectValidationReadCountForTests(join(projectDir, "Справочник", "Товары", "Формы", "ФормаЭлемента", "Форма.yaml")),
    ).toBe(1)
  })

  it("compiles each validation schema once per project validation run", async () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Справочник/Номенклатура/Свойства.yaml", ["Реквизиты:", "  Артикул: Строка"])
    writeProjectFile(projectDir, "Справочник/Контрагенты/Свойства.yaml", ["Комментарий: справочник"])
    writeProjectFile(projectDir, "Документ/Заказ/Свойства.yaml", ["Комментарий: документ"])
    writeProjectFile(projectDir, "Справочник/Номенклатура/Формы/ФормаЭлемента/Форма.yaml", [
      "Реквизиты:",
      "  Объект: Справочник.Номенклатура",
    ])
    writeProjectFile(projectDir, "Справочник/Контрагенты/Формы/ФормаЭлемента/Форма.yaml", [
      "Реквизиты:",
      "  Объект: Справочник.Контрагенты",
    ])
    const compile = vi.spyOn(TypeCompiler, "Compile")

    await validateProject({ projectDir, context: mockContext, concurrency: 1 })

    expect(compile).toHaveBeenCalledTimes(3)
  })

  it("validates MetadataObjectRefCollection targets from rules metadataTarget", async () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Справочник/Источник/Свойства.yaml", [
      "ВводитсяНаОсновании:",
      "  - Справочник.НетТакого",
    ])

    const diagnostics = (await validateProject({ projectDir, context: mockContext })).diagnostics

    expect(diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: "reference",
          severity: "error",
          message: 'Не найден объект "Справочник.НетТакого"',
        }),
      ])
    )
  })

  it("reports English YAML roots as ordinary structure errors", async () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Справочник/Источник/Свойства.yaml", [
      "ВводитсяНаОсновании:",
      "  - Catalog.Контрагенты",
    ])

    const diagnostics = (await validateProject({ projectDir, context: mockContext })).diagnostics
    const messages = diagnostics.map((diagnostic) => diagnostic.message).join("\n")

    expect(messages).toContain('Неизвестный корень "Catalog"')
    expect(messages).not.toContain("Справочник.Контрагенты")
  })

  function createProject(): string {
    const projectDir = mkdtempSync(join(tmpdir(), "nakidka-validate-project-"))
    tempDirs.push(projectDir)
    return projectDir
  }
})

function topLevelYamlDirs(): string[] {
  return TopLevelMetadataItemRules.flatMap((rule) =>
    typeof rule.itemTypePrefix === "string" ? [rule.itemTypePrefix] : []
  )
}

function minimalTopLevelPropertiesYAML(dir: string): string {
  if (dir === "ПакетXDTO") return "ПространствоИмен: http://example.org/test\n"
  if (dir === "Язык") return "КодЯзыка: ru\n"
  return "{}\n"
}

function writeProjectFile(projectDir: string, projectPath: string, lines: string[] | string): void {
  const filePath = join(projectDir, ...projectPath.split("/"))
  mkdirSync(resolve(filePath, ".."), { recursive: true })
  writeFileSync(filePath, Array.isArray(lines) ? `${lines.join("\n")}\n` : lines)
}
