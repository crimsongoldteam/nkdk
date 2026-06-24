import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join, resolve } from "path"
import { afterEach, describe, expect, it } from "vitest"
import { validateYamlProject } from "./validateProject"

describe("validateProject service", () => {
  const tempDirs: string[] = []

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
  })

  it("returns diagnostics and summary as JSON", async () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", ['НесуществующееПоле: "лишнее"'])

    const result = await validateYamlProject({ projectDir })

    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error(result.message)
    expect(result.summary.errors).toBe(1)
    expect(result.summary.warnings).toBe(0)
    expect(result.diagnostics[0]).toEqual(
      expect.objectContaining({
        filePath: "Справочник/Товары/Свойства.yaml",
        line: 1,
        severity: "error",
      }),
    )
  })

  it("omits warning diagnostics from JSON output", async () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", "Комментарий: владелец\n")
    writeProjectFile(projectDir, "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml", [
      "Элементы:",
      "  Кнопка:",
      "    Вид: Кнопка",
      "    Данные: Items.Таблица.CurrentData.Номенклатура",
    ])

    const result = await validateYamlProject({ projectDir })

    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error(result.message)
    expect(result.diagnostics).toEqual([])
    expect(result.summary).toEqual({ errors: 0, warnings: 0 })
  })

  it("returns not_found for a missing project directory", async () => {
    const projectDir = join(tmpdir(), "nakidka-missing-mcp-project")
    const result = await validateYamlProject({ projectDir })

    expect(result).toEqual({
      ok: false,
      code: "not_found",
      message: "YAML-проект не найден",
      details: { projectDir },
    })
  })

  it("returns invalid_arguments for filePath outside project", async () => {
    const projectDir = createProject()
    const outsideDir = createProject()
    const outsideFile = join(outsideDir, "Свойства.yaml")
    writeFileSync(outsideFile, "")

    const result = await validateYamlProject({ projectDir, filePath: outsideFile })

    expect(result.ok).toBe(false)
    if (result.ok) throw new Error("expected failure")
    expect(result.code).toBe("invalid_arguments")
    expect(result.message).toBe("Файл находится вне указанного YAML-проекта")
  })

  function createProject(): string {
    const projectDir = mkdtempSync(join(tmpdir(), "nakidka-mcp-validate-"))
    tempDirs.push(projectDir)
    return projectDir
  }
})

function writeProjectFile(projectDir: string, projectPath: string, lines: string[] | string): void {
  const filePath = join(projectDir, ...projectPath.split("/"))
  mkdirSync(resolve(filePath, ".."), { recursive: true })
  writeFileSync(filePath, Array.isArray(lines) ? `${lines.join("\n")}\n` : lines)
}
