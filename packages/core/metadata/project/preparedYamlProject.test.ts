import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { prepareYamlProject } from "./preparedYamlProject"
import { mergePreparedMetadataDeclarationsForTests } from "./preparedYamlProjectWorkerPool"

describe("prepareYamlProject", () => {
  const testTimeout = 20_000
  const tempDirs: string[] = []

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
  })

  function createProject(): string {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-prepare-yaml-"))
    tempDirs.push(projectDir)
    mkdirSync(join(projectDir, "Справочник", "Товары"), { recursive: true })
    writeFileSync(
      join(projectDir, "Справочник", "Товары", "Свойства.yaml"),
      ["Реквизиты:", "  Артикул:", "    Тип: Строка"].join("\n")
    )
    return projectDir
  }

  it(
    "prepares whole project and uses projectPath as YAML key without source text",
    async () => {
      const projectDir = createProject()
      const result = await prepareYamlProject({
        projectDir,
        context: { version: "2.20", defaultLanguage: "ru", exportToYAML: { toTyped: false } },
        concurrency: 2,
      })

      expect(result.ok).toBe(true)
      if (!result.ok) throw new Error(result.message)

      expect(result.project.files.map((file) => file.projectPath)).toEqual(["Справочник/Товары/Свойства.yaml"])
      expect(result.project.workers).toHaveLength(2)
      const yamlFiles = result.project.workers.flatMap((worker) => worker.yamlFiles)
      expect(yamlFiles).toHaveLength(1)
      expect(yamlFiles[0]).toMatchObject({
        projectPath: "Справочник/Товары/Свойства.yaml",
        role: "properties",
        owner: { dir: "Справочник", name: "Товары" },
      })
      expect(yamlFiles[0]).not.toHaveProperty("text")
      expect(yamlFiles[0]?.data).toEqual({
        Реквизиты: {
          Артикул: {
            Тип: "Строка",
          },
        },
      })
    },
    testTimeout
  )

  it(
    "keeps one partition per worker even when some workers receive no YAML files",
    async () => {
      const projectDir = createProject()
      const result = await prepareYamlProject({
        projectDir,
        context: { version: "2.20", defaultLanguage: "ru", exportToYAML: { toTyped: false } },
        concurrency: 4,
      })

      expect(result.ok).toBe(true)
      if (!result.ok) throw new Error(result.message)

      expect(result.project.workers.map((worker) => worker.workerIndex)).toEqual([0, 1, 2, 3])
      expect(result.project.workers.flatMap((worker) => worker.yamlFiles)).toHaveLength(1)
      expect(result.project.workers.filter((worker) => worker.yamlFiles.length === 0).length).toBeGreaterThan(0)
    },
    testTimeout
  )

  it(
    "builds metadata declarations and keeps dependencies on the source worker",
    async () => {
      const projectDir = createProject()
      mkdirSync(join(projectDir, "Документ", "Заказ"), { recursive: true })
      writeFileSync(
        join(projectDir, "Документ", "Заказ", "Свойства.yaml"),
        ["Реквизиты:", "  Товар:", "    Тип: Справочник.Товары"].join("\n")
      )

      const result = await prepareYamlProject({
        projectDir,
        context: { version: "2.20", defaultLanguage: "ru", exportToYAML: { toTyped: false } },
        concurrency: 2,
      })

      expect(result.ok).toBe(true)
      if (!result.ok) throw new Error(result.message)

      expect(result.project.metadataIndex.declarations.map((item) => item.canonical).sort()).toContain("Catalog.Товары")
      const dependency = result.project.workers
        .flatMap((worker) => worker.dependencyIndex.dependencies)
        .find((item) => item.canonical === "Catalog.Товары")
      expect(dependency).toMatchObject({
        sourceProjectPath: "Документ/Заказ/Свойства.yaml",
        kind: "metadata",
      })
    },
    testTimeout
  )

  it("fails metadata declaration merge on duplicate canonical name", () => {
    expect(
      mergePreparedMetadataDeclarationsForTests([
        { canonical: "Catalog.Товары", projectPath: "a.yaml", filePath: "/project/a.yaml" },
        { canonical: "Catalog.Товары", projectPath: "b.yaml", filePath: "/project/b.yaml" },
      ])
    ).toMatchObject({ ok: false, code: "declaration_conflict" })
  })
})
