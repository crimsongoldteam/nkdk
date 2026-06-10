import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join, resolve } from "path"
import { afterEach, describe, expect, it, vi } from "vitest"
import type { Diagnostic } from "@nakidka/core"
import { formatDiagnostics, validateYamlProject } from "./validate"

describe("validate command", () => {
  const tempDirs: string[] = []

  afterEach(() => {
    vi.restoreAllMocks()
    process.exitCode = undefined
    for (const dir of tempDirs.splice(0)) {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it("prints errors and warnings with a summary to stdout", async () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", ['НесуществующееПоле: "лишнее"'])
    writeProjectFile(projectDir, "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml", [
      "Элементы:",
      "  Кнопка:",
      "    Вид: Кнопка",
      "    Данные: Items.Таблица.CurrentData.Номенклатура",
    ])
    const stdout = captureStdout()
    const stderr = captureStderr()

    await validateYamlProject(projectDir)

    const text = writtenText(stdout)
    expect(text).toContain("Справочник/Товары/Свойства.yaml:1:21 error:")
    expect(text).toContain("Формы/ФормаЭлемента/Форма.yaml:4:5 warning:")
    expect(text).toContain("summary: 1 error, 1 warning")
    expect(stderr).not.toHaveBeenCalled()
    expect(process.exitCode).toBe(1)
  })

  it("keeps exit code zero for warnings only", async () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", "Комментарий: владелец\n")
    writeProjectFile(projectDir, "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml", [
      "Элементы:",
      "  Кнопка:",
      "    Вид: Кнопка",
      "    Данные: Items.Таблица.CurrentData.Номенклатура",
    ])
    const stdout = captureStdout()

    await validateYamlProject(projectDir)

    const text = writtenText(stdout)
    expect(text).toContain("warning:")
    expect(text).toContain("summary: 0 error, 1 warning")
    expect(process.exitCode).toBeUndefined()
  })

  it("validates a single properties file from --file", async () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", ['НесуществующееПоле: "лишнее"'])
    writeProjectFile(projectDir, "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml", [
      "Элементы:",
      "  Поле:",
      "    Вид: ПолеВвода",
      "    ПутьКДанным: Неизвестный",
    ])
    const stdout = captureStdout()

    await validateYamlProject(projectDir, { file: "Справочник/Товары/Свойства.yaml" })

    const text = writtenText(stdout)
    expect(text).toContain("Справочник/Товары/Свойства.yaml")
    expect(text).not.toContain("Форма.yaml")
  })

  it("rejects missing or invalid project directories as command usage errors", async () => {
    const missingDir = join(tmpdir(), "nakidka-missing-yaml-dir")
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
    await validateYamlProject(projectDir, { file: "Справочник/Товары/Команды/Команда.yaml" })
    expect(process.exitCode).toBe(2)
    expect(writtenText(stderr)).toContain("Ожидались пути вида")
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
      },
    ]

    expect(formatDiagnostics(diagnostics, projectDir)).toBe(
      [
        "Справочник/Товары/Свойства.yaml:2:3 warning: предупреждение",
        "Документ/Заказ/Свойства.yaml:1:1 error: ошибка",
      ].join("\n"),
    )
  })

  function createProject(): string {
    const projectDir = mkdtempSync(join(tmpdir(), "nakidka-validate-cli-"))
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
