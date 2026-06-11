import fs, { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join, resolve } from "path"
import { afterEach, describe, expect, it, vi } from "vitest"
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
      "  ОбщееИмя: Строка",
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

  function createProject(): string {
    const projectDir = mkdtempSync(join(tmpdir(), "nakidka-validate-project-"))
    tempDirs.push(projectDir)
    return projectDir
  }
})

function writeProjectFile(projectDir: string, projectPath: string, lines: string[] | string): void {
  const filePath = join(projectDir, ...projectPath.split("/"))
  mkdirSync(resolve(filePath, ".."), { recursive: true })
  writeFileSync(filePath, Array.isArray(lines) ? `${lines.join("\n")}\n` : lines)
}
