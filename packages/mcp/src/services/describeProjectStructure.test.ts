import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { describeProjectStructure } from "./describeProjectStructure"

const core = vi.hoisted(() => ({
  describeMetadataProjectDirectoryStructure: vi.fn(),
}))

vi.mock("../coreApi", () => ({
  loadCoreApi: vi.fn(async () => core),
}))

describe("describeProjectStructure service", () => {
  const tempDirs: string[] = []

  beforeEach(() => {
    core.describeMetadataProjectDirectoryStructure.mockReset()
    core.describeMetadataProjectDirectoryStructure.mockImplementation(({ projectDir, directoryPath, depth }) => ({
      projectDir,
      directoryPath: directoryPath ?? "",
      depth: depth ?? null,
      node: {
        name: "Товары",
        kind: "directory",
        pathTemplate: "Справочник/{Имя}",
        role: "metadataObject",
        required: true,
        repeatable: true,
        description: "Справочник",
        children: [
          {
            name: "Свойства.yaml",
            kind: "file",
            pathTemplate: "Справочник/{Имя}/Свойства.yaml",
            role: "properties",
            required: true,
            repeatable: false,
            description: "Свойства",
          },
          {
            name: "Формы",
            kind: "directory",
            pathTemplate: "Справочник/{Имя}/Формы",
            role: "forms",
            required: false,
            repeatable: false,
            description: "Формы",
          },
        ],
      },
    }))
  })

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
  })

  it("returns project structure as JSON payload", async () => {
    const projectDir = createProject()

    const result = await describeProjectStructure({ projectDir, directoryPath: "Справочник/Товары", depth: 1 })

    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error(result.message)
    expect(result.directoryPath).toBe("Справочник/Товары")
    expect(result.depth).toBe(1)
    expect(core.describeMetadataProjectDirectoryStructure).toHaveBeenCalledWith({
      projectDir,
      directoryPath: "Справочник/Товары",
      depth: 1,
    })
    expect(result.node.children).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "Свойства.yaml", kind: "file" }),
        expect.objectContaining({ name: "Формы", kind: "directory" }),
      ]),
    )
  })

  it("returns not_found for a missing project directory", async () => {
    const projectDir = join(tmpdir(), "nkdk-missing-project-structure")

    const result = await describeProjectStructure({ projectDir })

    expect(result).toEqual({
      ok: false,
      code: "not_found",
      message: "YAML-проект не найден",
      details: { projectDir },
    })
  })

  it("returns invalid_arguments for a file projectDir", async () => {
    const projectDir = createProject()
    const filePath = join(projectDir, "not-dir")
    writeFileSync(filePath, "")

    const result = await describeProjectStructure({ projectDir: filePath })

    expect(result).toEqual({
      ok: false,
      code: "invalid_arguments",
      message: "Путь не является каталогом YAML-проекта",
      details: { projectDir: filePath },
    })
  })

  it("returns invalid_arguments for outside and unsupported directories", async () => {
    const projectDir = createProject()
    const outsideDir = createProject()
    core.describeMetadataProjectDirectoryStructure.mockImplementation(({ directoryPath }) => {
      if (directoryPath === outsideDir) throw new Error("Каталог находится вне указанного YAML-проекта")
      throw new Error("Каталог не соответствует структуре metadata-проекта")
    })

    const outside = await describeProjectStructure({ projectDir, directoryPath: outsideDir })
    expect(outside.ok).toBe(false)
    if (outside.ok) throw new Error("expected failure")
    expect(outside.code).toBe("invalid_arguments")
    expect(outside.message).toBe("Каталог находится вне указанного YAML-проекта")

    const unsupported = await describeProjectStructure({ projectDir, directoryPath: "Справочник/Товары/Команды" })
    expect(unsupported.ok).toBe(false)
    if (unsupported.ok) throw new Error("expected failure")
    expect(unsupported.code).toBe("invalid_arguments")
    expect(unsupported.message).toBe("Каталог не соответствует структуре metadata-проекта")
  })

  function createProject(): string {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-mcp-project-structure-"))
    mkdirSync(projectDir, { recursive: true })
    tempDirs.push(projectDir)
    return projectDir
  }
})
