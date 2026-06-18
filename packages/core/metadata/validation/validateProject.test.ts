import fs, { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join, resolve } from "path"
import { TypeCompiler } from "@sinclair/typebox/compiler"
import { afterEach, describe, expect, it, vi } from "vitest"
import { TopLevelMetadataItemRules } from "~/metadata/appliedObjects/configuration/topLevelRules"
import { mockContext } from "~/tests/mockContext"
import { ProjectFileSchemaError } from "./projectFileSchema"
import { validateProject } from "./validateProject"

describe("validateProject", () => {
  const tempDirs: string[] = []

  afterEach(() => {
    vi.restoreAllMocks()
    for (const dir of tempDirs.splice(0)) {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it("validates all supported project files and sorts diagnostics", () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Справочник/АОшибочный/Свойства.yaml", [
      'НесуществующееПоле: "лишнее поле"',
    ])
    writeProjectFile(projectDir, "Справочник/ЯФорма/Свойства.yaml", ["Комментарий: владелец формы"])
    writeProjectFile(projectDir, "Справочник/ЯФорма/Формы/ФормаЭлемента/Форма.yaml", [
      "Элементы:",
      "  Поле:",
      "    Вид: ПолеВвода",
      "    ПутьКДанным: Неизвестный",
    ])

    const diagnostics = validateProject({ projectDir, context: mockContext }).diagnostics

    expect(diagnostics.map((diagnostic) => diagnostic.filePath)).toEqual([
      join(projectDir, "Справочник", "АОшибочный", "Свойства.yaml"),
      join(projectDir, "Справочник", "ЯФорма", "Формы", "ФормаЭлемента", "Форма.yaml"),
    ])
    expect(diagnostics[0]).toMatchObject({ source: "structure", severity: "error" })
    expect(diagnostics[1]?.message).toContain('ПутьКДанным "Неизвестный"')
  })

  it("validates a single form with schema and DataPath rules", () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", "")
    writeProjectFile(projectDir, "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml", [
      "ЛишнееПоле: true",
      "Элементы:",
      "  Поле:",
      "    Вид: ПолеВвода",
      "    ПутьКДанным: Неизвестный",
    ])

    const diagnostics = validateProject({
      projectDir,
      filePath: "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml",
      context: mockContext,
    }).diagnostics

    expect(diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ source: "structure", severity: "error", path: "/ЛишнееПоле" }),
        expect.objectContaining({
          source: "structure",
          severity: "error",
          message: expect.stringContaining('ПутьКДанным "Неизвестный"'),
        }),
      ]),
    )
  })

  it("warns about unimplemented dynamic list type-value checks instead of failing form import", () => {
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

    const diagnostics = validateProject({
      projectDir,
      filePath: "Справочник/Товары/Формы/ФормаСписка/Форма.yaml",
      context: mockContext,
    }).diagnostics

    expect(diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: "structure",
          severity: "warning",
          path: "/Реквизиты/Список/ДинамическийСписок/УсловноеОформление/Элементы/0/Отбор/Элементы/0/ПравоеЗначение",
          message:
            'Проверка значения типа "Документ.ПоступлениеБезналичныхДенежныхСредств" в условном оформлении динамического списка пока не реализована и будет добавлена в будущих версиях',
        }),
      ]),
    )
    expect(diagnostics.map((diagnostic) => diagnostic.message)).not.toEqual(
      expect.arrayContaining([expect.stringContaining("Не удалось импортировать форму")]),
    )
  })

  it("does not add a form import diagnostic when schema errors already explain the invalid form shape", () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", "")
    writeProjectFile(projectDir, "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml", [
      "Элементы: []",
    ])

    const diagnostics = validateProject({
      projectDir,
      filePath: "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml",
      context: mockContext,
    }).diagnostics

    expect(diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ source: "structure", severity: "error", path: "/Элементы" }),
      ]),
    )
    expect(diagnostics.map((diagnostic) => diagnostic.message)).not.toEqual(
      expect.arrayContaining([expect.stringContaining("Не удалось импортировать форму")]),
    )
  })

  it("validates a single properties file without validating sibling forms", () => {
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

    const diagnostics = validateProject({
      projectDir,
      filePath: "Справочник/Товары/Свойства.yaml",
      context: mockContext,
    }).diagnostics

    expect(diagnostics).toHaveLength(1)
    expect(diagnostics[0]).toMatchObject({
      filePath: join(projectDir, "Справочник", "Товары", "Свойства.yaml"),
      path: "/ТабличныеЧасти/ОбщееИмя",
      source: "structure",
      severity: "error",
    })
  })

  it("validates every top-level metadata object with YAML directory", () => {
    const projectDir = createProject()

    for (const dir of topLevelYamlDirs()) {
      writeProjectFile(projectDir, `${dir}/Тест/Свойства.yaml`, "{}\n")
    }

    const diagnostics = validateProject({ projectDir, context: mockContext }).diagnostics

    expect(diagnostics).toEqual([])
  })

  it("validates nested subsystem properties with schema rules", () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Подсистема/Администрирование/Свойства.yaml", "{}\n")
    writeProjectFile(projectDir, "Подсистема/Администрирование/Подсистемы/Настройки/Свойства.yaml", [
      "ЛишнееПоле: true",
    ])

    const diagnostics = validateProject({ projectDir, context: mockContext }).diagnostics

    expect(diagnostics).toEqual([
      expect.objectContaining({
        filePath: join(
          projectDir,
          "Подсистема",
          "Администрирование",
          "Подсистемы",
          "Настройки",
          "Свойства.yaml",
        ),
        source: "structure",
        severity: "error",
        path: "/ЛишнееПоле",
      }),
    ])
  })

  it("validates the root configuration YAML file", () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Конфигурация.yaml", [
      "Имя: Конфигурация",
      "ОсновнойЯзык: Язык.НеСуществует",
    ])

    const diagnostics = validateProject({ projectDir, context: mockContext }).diagnostics

    expect(diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          filePath: join(projectDir, "Язык", "НеСуществует", "Свойства.yaml"),
          source: "reference",
          severity: "error",
          message: 'Не найден объект "Язык.НеСуществует"',
        }),
      ]),
    )
  })

  it("validates a single root configuration file", () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Конфигурация.yaml", [
      "Имя: Конфигурация",
      "ОсновнойЯзык: Язык.НеСуществует",
    ])
    writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", ['НесуществующееПоле: "лишнее поле"'])

    const diagnostics = validateProject({
      projectDir,
      filePath: "Конфигурация.yaml",
      context: mockContext,
    }).diagnostics

    expect(diagnostics).toHaveLength(1)
    expect(diagnostics[0]).toMatchObject({
      filePath: join(projectDir, "Язык", "НеСуществует", "Свойства.yaml"),
      message: 'Не найден объект "Язык.НеСуществует"',
    })
  })

  it("accepts SystemEnumeration properties in catalog attributes and standard attributes", () => {
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

    const diagnostics = validateProject({
      projectDir,
      filePath: "Справочник/Файлы/Свойства.yaml",
      context: mockContext,
    }).diagnostics

    expect(diagnostics).toEqual([])
  })

  it("throws ProjectFileSchemaError for an unsupported single file inside the project", () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Справочник/Товары/Команды/Команда.yaml", "Имя: Тест\n")

    expect(() =>
      validateProject({
        projectDir,
        filePath: "Справочник/Товары/Команды/Команда.yaml",
        context: mockContext,
      }),
    ).toThrow(ProjectFileSchemaError)
  })

  it("uses one YAML cache for repeated owner reads", () => {
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

    validateProject({ projectDir, context: mockContext })

    const ownerPath = join(projectDir, "Справочник", "Номенклатура", "Свойства.yaml")
    expect(readFileSync.mock.calls.filter(([filePath]) => filePath === ownerPath)).toHaveLength(1)
  })

  it("compiles each validation schema once per project validation run", () => {
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

    validateProject({ projectDir, context: mockContext })

    expect(compile).toHaveBeenCalledTimes(3)
  })

  it("validates MetadataObjectRefCollection targets from rules metadataTarget", () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Справочник/Источник/Свойства.yaml", [
      "ВводитсяНаОсновании:",
      "  - Справочник.НетТакого",
    ])

    const diagnostics = validateProject({ projectDir, context: mockContext }).diagnostics

    expect(diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: "reference",
          severity: "error",
          message: 'Не найден объект "Справочник.НетТакого"',
        }),
      ]),
    )
  })

  it("reports English YAML roots as ordinary structure errors", () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Справочник/Источник/Свойства.yaml", [
      "ВводитсяНаОсновании:",
      "  - Catalog.Контрагенты",
    ])

    const diagnostics = validateProject({ projectDir, context: mockContext }).diagnostics
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
    typeof rule.itemTypePrefix === "string" ? [rule.itemTypePrefix] : [],
  )
}

function writeProjectFile(projectDir: string, projectPath: string, lines: string[] | string): void {
  const filePath = join(projectDir, ...projectPath.split("/"))
  mkdirSync(resolve(filePath, ".."), { recursive: true })
  writeFileSync(filePath, Array.isArray(lines) ? `${lines.join("\n")}\n` : lines)
}
