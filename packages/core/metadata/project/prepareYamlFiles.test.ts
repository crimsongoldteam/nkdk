import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it, vi } from "vitest"
import { hashFileBytes } from "../configurationIndex/hash"
import { prepareYamlFiles } from "./prepareYamlFiles"
import type { PreparedYamlProjectFileDescriptor } from "./preparedYamlProject"

describe("prepareYamlFiles", () => {
  const tempDirs: string[] = []

  afterEach(() => {
    vi.restoreAllMocks()
    for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
  })

  function createProject(): string {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-prepare-yaml-files-"))
    tempDirs.push(projectDir)
    mkdirSync(join(projectDir, "Справочник", "Товары"), { recursive: true })
    mkdirSync(join(projectDir, "Документ", "Заказ"), { recursive: true })
    return projectDir
  }

  function descriptor(projectDir: string, projectPath: string, itemType: string): PreparedYamlProjectFileDescriptor {
    const parts = projectPath.split("/")
    return {
      projectPath,
      filePath: join(projectDir, ...parts),
      role: "properties",
      owner: { dir: parts[0] ?? "", name: parts[1] ?? "" },
      itemType,
    }
  }

  it("reads each YAML as one Buffer, hashes those bytes and parses the same content", () => {
    const projectDir = createProject()
    const projectPath = "Справочник/Товары/Свойства.yaml"
    const filePath = join(projectDir, ...projectPath.split("/"))
    const source = ["Реквизиты:", "  Артикул:", "    Тип: Строка"].join("\n")
    writeFileSync(filePath, source)
    const readFileSync = vi.fn((path: string) => {
      expect(path).toBe(filePath)
      return Buffer.from(source)
    })

    const result = prepareYamlFiles({
      files: [descriptor(projectDir, projectPath, "Catalog")],
      itemTypeByYamlDir: { Справочник: "Catalog" },
      includeProjectFiles: true,
      hashFileBytes,
      readFileSync,
    })

    expect(readFileSync).toHaveBeenCalledTimes(1)
    expect(result.diagnostics).toEqual([])
    expect(result.projectFiles).toEqual([{ projectPath, contentHash: hashFileBytes(Buffer.from(source)) }])
    expect(result.yamlFiles[0]?.data).toEqual({
      Реквизиты: {
        Артикул: {
          Тип: "Строка",
        },
      },
    })
  })

  it("extracts declarations and dependencies without schema or reference validation", () => {
    const projectDir = createProject()
    writeFileSync(
      join(projectDir, "Справочник", "Товары", "Свойства.yaml"),
      ["Реквизиты:", "  Артикул:", "    Тип: Строка"].join("\n")
    )
    writeFileSync(
      join(projectDir, "Документ", "Заказ", "Свойства.yaml"),
      ["Реквизиты:", "  Товар:", "    Тип: Справочник.Товары"].join("\n")
    )

    const result = prepareYamlFiles({
      files: [
        descriptor(projectDir, "Справочник/Товары/Свойства.yaml", "Catalog"),
        descriptor(projectDir, "Документ/Заказ/Свойства.yaml", "Document"),
      ],
      itemTypeByYamlDir: { Справочник: "Catalog", Документ: "Document" },
    })

    expect(result.diagnostics).toEqual([])
    expect(result.declarations.map((item) => item.canonical).sort()).toEqual(["Catalog.Товары", "Document.Заказ"])
    expect(result.dependencies).toEqual([
      expect.objectContaining({
        canonical: "Catalog.Товары",
        sourceProjectPath: "Документ/Заказ/Свойства.yaml",
        kind: "metadata",
      }),
    ])
  })

  it("aggregates syntax and I/O diagnostics and continues with other files", () => {
    const projectDir = createProject()
    writeFileSync(join(projectDir, "Справочник", "Товары", "Свойства.yaml"), "Реквизиты: [")

    const result = prepareYamlFiles({
      files: [
        descriptor(projectDir, "Справочник/Товары/Свойства.yaml", "Catalog"),
        descriptor(projectDir, "Документ/Заказ/Свойства.yaml", "Document"),
      ],
      itemTypeByYamlDir: { Справочник: "Catalog", Документ: "Document" },
    })

    expect(result.yamlFiles).toHaveLength(1)
    expect(result.yamlFiles[0]?.syntaxDiagnostics[0]).toMatchObject({ source: "syntax", severity: "error" })
    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        filePath: join(projectDir, "Документ", "Заказ", "Свойства.yaml"),
        source: "external-file",
      }),
    ])
  })
})
