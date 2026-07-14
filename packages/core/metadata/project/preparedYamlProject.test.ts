import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import {
  getProjectValidationReadCountForTests,
  resetProjectValidationReadCountForTests,
} from "../validation/projectValidationPasses"
import { createProjectYamlCacheFromPreparedFiles } from "../validation/projectYamlCache"
import { prepareYamlProject } from "./preparedYamlProject"
import {
  createPreparedYamlProjectWorkerPool,
  mergePreparedMetadataDeclarationsForTests,
} from "./preparedYamlProjectWorkerPool"

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
      expect(JSON.stringify(result.project)).not.toContain("Реквизиты:")
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

  it("returns resource file descriptions without reading resource content", async () => {
    const projectDir = createProject()
    writeFileSync(join(projectDir, "Справочник", "Товары", "МодульМенеджера.bsl"), "Процедура Тест()\nКонецПроцедуры\n")

    const result = await prepareYamlProject({
      projectDir,
      context: { version: "2.20", defaultLanguage: "ru", exportToYAML: { toTyped: false } },
      concurrency: 1,
    })

    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error(result.message)

    expect(result.project.resourceFiles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          projectPath: "Справочник/Товары/МодульМенеджера.bsl",
          owner: { dir: "Справочник", name: "Товары" },
        }),
      ])
    )
    expect(result.project.workers.flatMap((worker) => worker.yamlFiles).map((file) => file.projectPath)).not.toContain(
      "Справочник/Товары/МодульМенеджера.bsl"
    )
  })

  it("validates prepared YAML without reading the file again", async () => {
    const projectDir = createProject()
    const yamlPath = join(projectDir, "Справочник", "Товары", "Свойства.yaml")
    resetProjectValidationReadCountForTests()

    const prepared = await prepareYamlProject({
      projectDir,
      context: { version: "2.20", defaultLanguage: "ru", exportToYAML: { toTyped: false } },
      concurrency: 1,
    })

    expect(prepared.ok).toBe(true)
    if (!prepared.ok) throw new Error(prepared.message)

    const file = prepared.project.workers.flatMap((worker) => worker.yamlFiles)[0]!
    const cache = createProjectYamlCacheFromPreparedFiles([file])
    expect(cache.get(yamlPath)).toMatchObject({ filePath: yamlPath })
    expect(getProjectValidationReadCountForTests(yamlPath)).toBe(0)
  })

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

  it("does not start physical workers for empty partitions", async () => {
    let startedWorkers = 0
    const pool = createPreparedYamlProjectWorkerPool({
      concurrency: 4,
      createWorkerPool: () => {
        startedWorkers += 1
        return {
          async run() {
            return {
              kind: "prepareResult" as const,
              yamlFiles: [],
              declarations: [],
              dependencies: [],
              diagnostics: [],
            }
          },
          async destroy() {
            return undefined
          },
        }
      },
    })

    try {
      const result = await pool.run({
        projectDir: "/project",
        context: { version: "2.20", defaultLanguage: "ru", exportToYAML: { toTyped: false } },
        files: [
          {
            projectPath: "Справочник/Товары/Свойства.yaml",
            filePath: "/project/Справочник/Товары/Свойства.yaml",
            role: "properties",
            owner: { dir: "Справочник", name: "Товары" },
            itemType: "Catalog",
          },
        ],
      })

      expect(startedWorkers).toBe(1)
      expect(result.workers).toHaveLength(4)
    } finally {
      await pool.close()
    }
  })
})
