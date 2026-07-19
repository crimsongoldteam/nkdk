import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join, resolve } from "path"
import { afterEach, describe, expect, it, vi } from "vitest"
import { ProjectFileSchemaError, validateProject, type Diagnostic } from "@nkdk/core"
import { formatDiagnostics, validateYamlProject } from "./validate"

const coreMockState = vi.hoisted(() => ({
  actualValidateProject: undefined as undefined | typeof validateProject,
}))

vi.mock("@nkdk/core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@nkdk/core")>()
  coreMockState.actualValidateProject = actual.validateProject

  return {
    ...actual,
    validateProject: vi.fn((params: Parameters<typeof actual.validateProject>[0]) => actual.validateProject(params)),
  }
})

describe("validate command", () => {
  const tempDirs: string[] = []

  afterEach(() => {
    if (coreMockState.actualValidateProject !== undefined) {
      vi.mocked(validateProject).mockImplementation(coreMockState.actualValidateProject)
    }
    vi.restoreAllMocks()
    process.exitCode = undefined
    for (const dir of tempDirs.splice(0)) {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it("prints errors without warnings with a summary to stdout", async () => {
    const projectDir = createProject()
    vi.mocked(validateProject).mockResolvedValue({
      diagnostics: [
        {
          filePath: join(projectDir, "Справочник", "Товары", "Свойства.yaml"),
          line: 1,
          col: 1,
          severity: "error",
          source: "structure",
          message: "лишнее поле",
        },
        {
          filePath: join(projectDir, "Справочник", "Товары", "Формы", "ФормаЭлемента", "Форма.yaml"),
          line: 1,
          col: 1,
          severity: "warning",
          source: "reference",
          message: "скрытое предупреждение",
        },
      ],
    })
    const stdout = captureStdout()
    const stderr = captureStderr()

    await validateYamlProject(projectDir)

    const text = writtenText(stdout)
    expect(text).toContain("Справочник/Товары/Свойства.yaml error:")
    expect(text).not.toContain("warning:")
    expect(text).toContain("summary: 1 error, 0 warning")
    expect(stderr).not.toHaveBeenCalled()
    expect(process.exitCode).toBe(1)
  })

  it("prints a clean summary for warnings only", async () => {
    const projectDir = createProject()
    vi.mocked(validateProject).mockResolvedValue({
      diagnostics: [
        {
          filePath: join(projectDir, "Справочник", "Товары", "Свойства.yaml"),
          line: 1,
          col: 1,
          severity: "warning",
          source: "reference",
          message: "скрытое предупреждение",
        },
      ],
    })
    const stdout = captureStdout()

    await validateYamlProject(projectDir)

    const text = writtenText(stdout)
    expect(text).not.toContain("warning:")
    expect(text).toBe("summary: 0 error, 0 warning\n")
    expect(process.exitCode).toBeUndefined()
  })

  it("validates a single properties file from --file", async () => {
    const projectDir = createProject()
    vi.mocked(validateProject).mockResolvedValue({
      diagnostics: [
        {
          filePath: join(projectDir, "Справочник", "Товары", "Свойства.yaml"),
          line: 1,
          col: 1,
          severity: "error",
          source: "structure",
          message: "лишнее поле",
        },
      ],
    })
    const stdout = captureStdout()

    await validateYamlProject(projectDir, { file: "Справочник/Товары/Свойства.yaml" })

    const text = writtenText(stdout)
    expect(validateProject).toHaveBeenCalledWith({
      projectDir,
      filePath: "Справочник/Товары/Свойства.yaml",
    })
    expect(text).toContain("Справочник/Товары/Свойства.yaml")
    expect(text).not.toContain("Форма.yaml")
  })

  it("validates a single root configuration file from --file", async () => {
    const projectDir = createProject()
    vi.mocked(validateProject).mockResolvedValue({
      diagnostics: [
        {
          filePath: join(projectDir, "Язык", "НеСуществует", "Свойства.yaml"),
          line: 1,
          col: 1,
          severity: "error",
          source: "reference",
          message: 'Не найден объект "Язык.НеСуществует"',
        },
      ],
    })
    const stdout = captureStdout()

    await validateYamlProject(projectDir, { file: "Конфигурация.yaml" })

    const text = writtenText(stdout)
    expect(validateProject).toHaveBeenCalledWith({
      projectDir,
      filePath: "Конфигурация.yaml",
    })
    expect(text).toContain("Язык/НеСуществует/Свойства.yaml")
    expect(text).toContain('Не найден объект "Язык.НеСуществует"')
    expect(text).not.toContain("Справочник/Товары/Свойства.yaml")
    expect(process.exitCode).toBe(1)
  })

  it("accepts SystemEnumeration properties through the public core entrypoint", async () => {
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
    const stdout = captureStdout()

    await validateYamlProject(projectDir, { file: "Справочник/Файлы/Свойства.yaml" })

    expect(writtenText(stdout)).toBe("summary: 0 error, 0 warning\n")
    expect(process.exitCode).toBeUndefined()
  })

  it("rejects missing or invalid project directories as command usage errors", async () => {
    const missingDir = join(tmpdir(), "nkdk-missing-yaml-dir")
    const filePath = join(createProject(), "not-a-directory.yaml")
    writeFileSync(filePath, "")
    const stderr = captureStderr()

    await validateYamlProject("")
    expect(process.exitCode).toBe(2)
    expect(writtenText(stderr)).toContain("Не указан путь к YAML-проекту")

    process.exitCode = undefined
    stderr.mockClear()
    await validateYamlProject(missingDir)
    expect(process.exitCode).toBe(2)
    expect(writtenText(stderr)).toContain("YAML-проект не найден")

    process.exitCode = undefined
    stderr.mockClear()
    await validateYamlProject(filePath)
    expect(process.exitCode).toBe(2)
    expect(writtenText(stderr)).toContain("не является каталогом")
  })

  it("rejects --file outside the project and unsupported --file with exit code 2", async () => {
    const projectDir = createProject()
    const outsideFile = join(createProject(), "Свойства.yaml")
    writeFileSync(outsideFile, "")
    writeProjectFile(projectDir, "Справочник/Товары/Команды/Команда.yaml", "Имя: Тест\n")
    const stderr = captureStderr()

    await validateYamlProject(projectDir, { file: outsideFile })
    expect(process.exitCode).toBe(2)
    expect(writtenText(stderr)).toContain("Файл находится вне указанного YAML-проекта")

    process.exitCode = undefined
    stderr.mockClear()
    vi.mocked(validateProject).mockRejectedValue(new ProjectFileSchemaError("Ожидались Конфигурация.yaml"))
    await validateYamlProject(projectDir, { file: "Справочник/Товары/Команды/Команда.yaml" })
    expect(process.exitCode).toBe(2)
    expect(validateProject).toHaveBeenCalledWith({
      projectDir,
      filePath: "Справочник/Товары/Команды/Команда.yaml",
    })
    expect(writtenText(stderr)).toContain("Ожидались Конфигурация.yaml")
  })

  it("formats diagnostics with project-relative POSIX paths", () => {
    const projectDir = createProject()
    const diagnostics: Diagnostic[] = [
      {
        filePath: join(projectDir, "Справочник", "Товары", "Свойства.yaml"),
        line: 2,
        col: 3,
        severity: "warning",
        source: "reference",
        message: "предупреждение",
      },
      {
        filePath: join(projectDir, "Документ", "Заказ", "Свойства.yaml"),
        line: 1,
        col: 1,
        severity: "error",
        source: "structure",
        message: "ошибка",
        path: "/Реквизиты/Контрагент/Тип",
      },
    ]

    expect(formatDiagnostics(diagnostics, projectDir)).toBe(
      [
        "Справочник/Товары/Свойства.yaml warning: предупреждение",
        "Документ/Заказ/Свойства.yaml error: ошибка (instancePath: /Реквизиты/Контрагент/Тип)",
      ].join("\n")
    )
  })

  function createProject(): string {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-validate-cli-"))
    tempDirs.push(projectDir)
    return projectDir
  }
})

function writeProjectFile(projectDir: string, projectPath: string, lines: string[] | string): void {
  const filePath = join(projectDir, ...projectPath.split("/"))
  mkdirSync(resolve(filePath, ".."), { recursive: true })
  writeFileSync(filePath, Array.isArray(lines) ? `${lines.join("\n")}\n` : lines)
}

function captureStdout() {
  return vi.spyOn(process.stdout, "write").mockImplementation(() => true)
}

function captureStderr() {
  return vi.spyOn(process.stderr, "write").mockImplementation(() => true)
}

function writtenText(writer: ReturnType<typeof captureStdout>): string {
  return writer.mock.calls.map(([chunk]) => String(chunk)).join("")
}
