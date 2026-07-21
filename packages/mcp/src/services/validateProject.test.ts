import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join, resolve } from "path"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { resetValidationHandleForTests } from "./validationHandle"
import { validateYamlProject } from "./validateProject"

const core = vi.hoisted(() => ({
  ProjectFileSchemaError: class ProjectFileSchemaError extends Error {},
  createValidationWorkerPoolHandle: vi.fn(),
  validateProject: vi.fn(),
}))

vi.mock("../coreApi", () => ({
  loadCoreApi: vi.fn(async () => core),
}))

describe("validateProject service", () => {
  const tempDirs: string[] = []

  beforeEach(() => {
    core.validateProject.mockReset()
    core.validateProject.mockResolvedValue({ diagnostics: [] })
    core.createValidationWorkerPoolHandle.mockReset()
    core.createValidationWorkerPoolHandle.mockReturnValue({
      validateProject: core.validateProject,
      close: vi.fn(),
      size: vi.fn(() => 1),
    })
    resetValidationHandleForTests()
  })

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
  })

  it("returns diagnostics and summary as JSON", async () => {
    const projectDir = createProject()
    const componentDir = join(projectDir, "cf")
    writeProjectFile(componentDir, "Справочник/Товары/Свойства.yaml", ['НесуществующееПоле: "лишнее"'])
    core.validateProject.mockResolvedValue({
      diagnostics: [
        {
          filePath: join(componentDir, "Справочник", "Товары", "Свойства.yaml"),
          line: 1,
          col: 1,
          severity: "error",
          message: "Неизвестное поле",
          path: "/НесуществующееПоле",
        },
      ],
    })

    const result = await validateYamlProject({ projectDir })

    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error(result.message)
    expect(result.summary.errors).toBe(1)
    expect(result.summary.warnings).toBe(0)
    expect(result.diagnostics[0]).toEqual(
      expect.objectContaining({
        filePath: "Справочник/Товары/Свойства.yaml",
        severity: "error",
        path: "/НесуществующееПоле",
      }),
    )
    expect(result.diagnostics[0]).not.toHaveProperty("line")
    expect(result.diagnostics[0]).not.toHaveProperty("col")
    expect(core.validateProject).toHaveBeenCalledWith({ projectDir: componentDir })
  })

  it("reuses one validation handle across service calls", async () => {
    const projectDir = createProject()
    const componentDir = join(projectDir, "cf")

    await validateYamlProject({ projectDir })
    await validateYamlProject({ projectDir })

    expect(core.createValidationWorkerPoolHandle).toHaveBeenCalledTimes(1)
    expect(core.validateProject).toHaveBeenCalledTimes(2)
    expect(core.validateProject).toHaveBeenNthCalledWith(1, { projectDir: componentDir })
    expect(core.validateProject).toHaveBeenNthCalledWith(2, { projectDir: componentDir })
  })

  it("omits warning diagnostics from JSON output", async () => {
    const projectDir = createProject()
    const componentDir = join(projectDir, "cf")
    writeProjectFile(componentDir, "Справочник/Товары/Свойства.yaml", "Комментарий: владелец\n")
    writeProjectFile(componentDir, "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml", [
      "Элементы:",
      "  Кнопка:",
      "    Вид: Кнопка",
      "    Данные: Items.Таблица.CurrentData.Номенклатура",
    ])
    core.validateProject.mockResolvedValue({
      diagnostics: [
        {
          filePath: join(componentDir, "Справочник", "Товары", "Свойства.yaml"),
          line: 1,
          col: 1,
          severity: "warning",
          message: "Предупреждение",
        },
      ],
    })

    const result = await validateYamlProject({ projectDir })

    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error(result.message)
    expect(result.diagnostics).toEqual([])
    expect(result.summary).toEqual({ errors: 0, warnings: 0 })
  })

  it("returns not_found for a missing project directory", async () => {
    const projectDir = join(tmpdir(), "nkdk-missing-mcp-project")
    const result = await validateYamlProject({ projectDir })

    expect(result).toEqual({
      ok: false,
      code: "not_found",
      message: "Проект не найден",
      details: { projectDir },
    })
  })

  it("requires cf component in project root", async () => {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-mcp-validate-no-cf-"))
    tempDirs.push(projectDir)

    const result = await validateYamlProject({ projectDir })

    expect(result.ok).toBe(false)
    if (result.ok) throw new Error("expected failure")
    expect(result.code).toBe("not_found")
    expect(result.message).toBe("Компонент cf не найден")
  })

  function createProject(): string {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-mcp-validate-"))
    mkdirSync(join(projectDir, "cf"), { recursive: true })
    tempDirs.push(projectDir)
    return projectDir
  }
})

function writeProjectFile(projectDir: string, projectPath: string, lines: string[] | string): void {
  const filePath = join(projectDir, ...projectPath.split("/"))
  mkdirSync(resolve(filePath, ".."), { recursive: true })
  writeFileSync(filePath, Array.isArray(lines) ? `${lines.join("\n")}\n` : lines)
}
