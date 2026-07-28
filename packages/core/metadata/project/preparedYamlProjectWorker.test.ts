import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { mockContext } from "../../tests/mockContext"
import { evaluateProjectFirstPass } from "../validation/projectFirstPassReadiness"
import { createValidationRulesSnapshot } from "../validation/rulesSnapshot"
import runPreparedYamlProjectWorkerTask, { collectValidationFacts } from "./preparedYamlProjectWorker"

const tempDirs: string[] = []

afterEach(() => {
  for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

describe("collectValidationFacts", () => {
  it("rejects the whole command when a discovered YAML file can no longer be read", async () => {
    const projectDir = createTempDir()
    const filePath = join(projectDir, "Справочник", "Товары", "Свойства.yaml")

    await expect(
      collectValidationFacts({
        kind: "collectValidationFacts",
        workerIndex: 0,
        projectDir,
        files: [descriptor(filePath)],
        rulesSnapshot: createValidationRulesSnapshot(mockContext),
      })
    ).rejects.toThrow("Не удалось прочитать YAML-файл")
  })

  it("passes through an extractor exception instead of returning a partial contribution", async () => {
    const projectDir = createTempDir()
    const filePath = join(projectDir, "Справочник", "Товары", "Свойства.yaml")
    mkdirSync(join(projectDir, "Справочник", "Товары"), { recursive: true })
    writeFileSync(filePath, "Реквизиты: {}\n")

    await expect(
      collectValidationFacts(
        {
          kind: "collectValidationFacts",
          workerIndex: 0,
          projectDir,
          files: [descriptor(filePath)],
          rulesSnapshot: createValidationRulesSnapshot(mockContext),
        },
        {
          extractFacts() {
            throw new Error("fact extractor failed")
          },
        }
      )
    ).rejects.toThrow("fact extractor failed")
  })

  it("keeps valid metadata dependencies while schema diagnostics are disabled", async () => {
    const projectDir = createTempDir()
    const filePath = join(projectDir, "ФункциональнаяОпция", "ИспользоватьАртикулы", "Свойства.yaml")
    mkdirSync(join(projectDir, "ФункциональнаяОпция", "ИспользоватьАртикулы"), { recursive: true })
    writeFileSync(filePath, ["СоставФункциональнойОпции:", "  - Catalog.Номенклатура.Attribute.Артикул", ""].join("\n"))

    const contribution = await collectValidationFacts({
      kind: "collectValidationFacts",
      workerIndex: 0,
      projectDir,
      files: [
        {
          componentPath: "cf",
          componentDir: projectDir,
          rootProjectPath: "cf/ФункциональнаяОпция/ИспользоватьАртикулы/Свойства.yaml",
          projectPath: "ФункциональнаяОпция/ИспользоватьАртикулы/Свойства.yaml",
          filePath,
          role: "properties",
          owner: { dir: "ФункциональнаяОпция", name: "ИспользоватьАртикулы" },
          itemType: "FunctionalOption",
        },
      ],
      rulesSnapshot: createValidationRulesSnapshot(mockContext),
    })

    expect(contribution.pendingReferences).toEqual([
      expect.objectContaining({
        canonical: "Catalog.Номенклатура.Attribute.Артикул",
        filePath,
        yamlPath: ["СоставФункциональнойОпции", 0],
      }),
    ])
  })
})

describe("validation first-pass worker boundary", () => {
  it("parses a mixed component batch once and keeps contributions component-scoped", async () => {
    const projectDir = createTempDir()
    const files = [
      componentProperties(projectDir, "cf", "Основная"),
      componentProperties(projectDir, "cfe/Продажи", "Продажи"),
      componentProperties(projectDir, "cfe/Склад", "Склад"),
    ]
    for (const file of files) {
      mkdirSync(join(file.componentDir, "Справочник", file.owner.name), { recursive: true })
      writeFileSync(file.filePath, "{}\n")
    }

    await runPreparedYamlProjectWorkerTask({
      kind: "initValidation",
      workerIndex: 0,
      context: mockContext,
      rulesSnapshot: createValidationRulesSnapshot(mockContext),
    })
    const result = await runPreparedYamlProjectWorkerTask({
      kind: "validateFirstPass",
      workerIndex: 0,
      projectDir,
      context: mockContext,
      files,
    })

    expect(result.kind).toBe("validateFirstPassResult")
    if (result.kind !== "validateFirstPassResult") throw new Error("unexpected worker response")
    expect(result.components.map(({ componentPath }) => componentPath)).toEqual([
      "cf",
      "cfe/Продажи",
      "cfe/Склад",
    ])
    expect(result.components.map(({ contribution }) => contribution.objectRecords.length)).toEqual([1, 1, 1])
    expect(result.fileResults.map(({ rootProjectPath }) => rootProjectPath)).toEqual([
      "cf/Справочник/Основная/Свойства.yaml",
      "cfe/Продажи/Справочник/Продажи/Свойства.yaml",
      "cfe/Склад/Справочник/Склад/Свойства.yaml",
    ])
    expect(result.yamlLifetime).toMatchObject({ current: 0, max: 1, parsed: 3 })
  }, 120_000)

  it("returns a failed file result when a descriptor cannot be classified", async () => {
    const projectDir = createTempDir()
    const componentDir = join(projectDir, "cf")
    const filePath = join(componentDir, "Неизвестно.yaml")
    const file = {
      componentPath: "cf",
      componentDir,
      rootProjectPath: "cf/Конфигурация.yaml",
      projectPath: "Конфигурация.yaml",
      filePath,
      role: "configuration" as const,
      owner: { dir: "", name: "Конфигурация" },
      itemType: "Configuration",
    }
    await runPreparedYamlProjectWorkerTask({
      kind: "initValidation",
      workerIndex: 0,
      context: mockContext,
      rulesSnapshot: createValidationRulesSnapshot(mockContext),
    })

    const result = await runPreparedYamlProjectWorkerTask({
      kind: "validateFirstPass",
      workerIndex: 0,
      projectDir,
      context: mockContext,
      files: [file],
    })

    expect(result.kind).toBe("validateFirstPassResult")
    if (result.kind !== "validateFirstPassResult") throw new Error("unexpected worker response")
    expect(result.fileResults).toEqual([
      {
        componentPath: "cf",
        filePath,
        rootProjectPath: "cf/Конфигурация.yaml",
        contributedFacts: false,
        schemaDiagnostics: [],
      },
    ])
    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        filePath,
        source: "structure",
        severity: "error",
        message: expect.stringContaining("Не удалось классифицировать YAML-файл компонента"),
      }),
    ])
    expect(result.schemaDiagnostics).toEqual([])
    expect(
      evaluateProjectFirstPass({
        hasConfiguration: true,
        componentPaths: ["cf", "cfe/Продажи"],
        firstPass: result,
      })
    ).toMatchObject({
      configurationReady: false,
      blockedExtensionPaths: ["cfe/Продажи"],
    })
  }, 120_000)
})

function createTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "nkdk-validation-facts-worker-"))
  tempDirs.push(dir)
  return dir
}

function descriptor(filePath: string) {
  return {
    componentPath: "cf",
    componentDir: filePath.replace(/\/Справочник\/Товары\/Свойства\.yaml$/, ""),
    rootProjectPath: "cf/Справочник/Товары/Свойства.yaml",
    projectPath: "Справочник/Товары/Свойства.yaml",
    filePath,
    role: "properties" as const,
    owner: { dir: "Справочник", name: "Товары" },
    itemType: "Catalog",
  }
}

function componentProperties(projectDir: string, componentPath: string, name: string) {
  const componentDir = join(projectDir, ...componentPath.split("/"))
  const projectPath = `Справочник/${name}/Свойства.yaml`
  return {
    componentPath,
    componentDir,
    rootProjectPath: `${componentPath}/${projectPath}`,
    projectPath,
    filePath: join(componentDir, ...projectPath.split("/")),
    role: "properties" as const,
    owner: { dir: "Справочник", name },
    itemType: "Catalog",
  }
}
