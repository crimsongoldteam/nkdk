import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { performance } from "node:perf_hooks"
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest"
import { mockContext } from "../../tests/mockContext"
import { evaluateProjectFirstPass } from "../validation/projectFirstPassReadiness"
import { createProjectValidationGraph } from "../validation/projectValidationGraph"
import { createValidationRulesSnapshot } from "../validation/rulesSnapshot"
import { createSharedProjectValidationGraph } from "../validation/sharedValidationSnapshot"
import runPreparedYamlProjectWorkerTask, { collectValidationFacts } from "./preparedYamlProjectWorker"

const tempDirs: string[] = []

beforeAll(async () => {
  await runPreparedYamlProjectWorkerTask({
    kind: "initValidation",
    workerIndex: 0,
    context: mockContext,
    rulesSnapshot: createValidationRulesSnapshot(mockContext),
  })
})

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
  let uniqueNamesProfile = ""
  let commonFormNamesProfile = ""
  let commonFormDiagnostics: readonly { path?: string }[] = []

  beforeAll(async () => {
    const projectDir = createTempDir()
    const componentDir = join(projectDir, "cf")
    const projectPath = "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml"
    const filePath = join(componentDir, ...projectPath.split("/"))
    const properties = componentProperties(projectDir, "cf", "ТоварыПрофиль")
    mkdirSync(dirname(filePath), { recursive: true })
    mkdirSync(dirname(properties.filePath), { recursive: true })
    writeFileSync(filePath, ["Элементы:", "  Поле:", "    Вид: ПолеВвода", ""].join("\n"))
    writeFileSync(properties.filePath, "{}\n")

    const previousProfile = process.env["NKDK_PROFILE"]
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined)
    let profileLines: string[] = []
    process.env["NKDK_PROFILE"] = "1"
    try {
      await runPreparedYamlProjectWorkerTask({
        kind: "validateFirstPass",
        workerIndex: 0,
        projectDir,
        context: mockContext,
        files: [
          properties,
          {
            componentPath: "cf",
            componentDir,
            rootProjectPath: `cf/${projectPath}`,
            projectPath,
            filePath,
            role: "form",
            owner: { dir: "Справочник", name: "Товары" },
            itemType: "ClientApplicationForm",
          },
        ],
      })
      profileLines = error.mock.calls.map(([line]) => String(line))
    } finally {
      if (previousProfile === undefined) delete process.env["NKDK_PROFILE"]
      else process.env["NKDK_PROFILE"] = previousProfile
      error.mockRestore()
    }

    uniqueNamesProfile = profileLine(profileLines, "Проверка уникальности имён элементов формы")
  }, 120_000)

  it("публикует отдельное время проверки уникальности имён элементов формы", () => {
    expect(uniqueNamesProfile).toContain("items=1")
    expect(Number.isFinite(profileTime(uniqueNamesProfile))).toBe(true)
  })

  beforeAll(async () => {
    const projectDir = createTempDir()
    const componentDir = join(projectDir, "cf")
    const commonFormProjectPath = "ОбщаяФорма/РабочийСтол/Свойства.yaml"
    const commonFormFilePath = join(componentDir, ...commonFormProjectPath.split("/"))
    const properties = componentProperties(projectDir, "cf", "ТоварыПрофиль")
    mkdirSync(dirname(commonFormFilePath), { recursive: true })
    mkdirSync(dirname(properties.filePath), { recursive: true })
    writeFileSync(
      commonFormFilePath,
      [
        "Форма:",
        "  Элементы:",
        "    Поле:",
        "      Вид: ПолеВвода",
        "    ПолеРасширеннаяПодсказка:",
        "      Вид: ПолеВвода",
        "",
      ].join("\n")
    )
    writeFileSync(properties.filePath, "{}\n")

    const previousProfile = process.env["NKDK_PROFILE"]
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined)
    let profileLines: string[] = []
    process.env["NKDK_PROFILE"] = "1"
    try {
      const result = await runPreparedYamlProjectWorkerTask({
        kind: "validateFirstPass",
        workerIndex: 0,
        projectDir,
        context: mockContext,
        files: [
          properties,
          {
            componentPath: "cf",
            componentDir,
            rootProjectPath: `cf/${commonFormProjectPath}`,
            projectPath: commonFormProjectPath,
            filePath: commonFormFilePath,
            role: "properties",
            owner: { dir: "ОбщаяФорма", name: "РабочийСтол" },
            itemType: "MetadataCommonForm",
          },
        ],
      })
      if (result.kind !== "validateFirstPassResult") throw new Error("unexpected worker response")
      commonFormDiagnostics = result.diagnostics
      profileLines = error.mock.calls.map(([line]) => String(line))
    } finally {
      if (previousProfile === undefined) delete process.env["NKDK_PROFILE"]
      else process.env["NKDK_PROFILE"] = previousProfile
      error.mockRestore()
    }

    commonFormNamesProfile = profileLine(profileLines, "Проверка уникальности имён элементов формы")
  }, 120_000)

  it("учитывает в профиле только проверенные значения общих форм", () => {
    expect(commonFormDiagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: "/Форма/Элементы/ПолеРасширеннаяПодсказка" }),
      ])
    )
    expect(commonFormNamesProfile).toContain("items=1")
  })

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

describe("validation second-pass worker profile", () => {
  it("attributes eager active views to context construction and excludes blocked states from items", async () => {
    const projectDir = createTempDir()
    const files = [
      componentProperties(projectDir, "cf", "Источник"),
      componentProperties(projectDir, "cfe/A", "ЗаблокированA"),
      componentProperties(projectDir, "cfe/B", "ЗаблокированB"),
    ]
    for (const file of files) mkdirSync(dirname(file.filePath), { recursive: true })
    writeFileSync(files[0]!.filePath, ["ВводитсяНаОсновании:", "  - Справочник.НетТакого", ""].join("\n"))
    writeFileSync(files[1]!.filePath, "{}\n")
    writeFileSync(files[2]!.filePath, "{}\n")

    const firstPass = await runPreparedYamlProjectWorkerTask({
      kind: "validateFirstPass",
      workerIndex: 0,
      projectDir,
      context: mockContext,
      files,
    })
    expect(firstPass.kind).toBe("validateFirstPassResult")
    if (firstPass.kind !== "validateFirstPassResult") throw new Error("unexpected worker response")
    const graph = createProjectValidationGraph(firstPass.components)
    const cfLayer = graph.layers.find(({ componentPath }) => componentPath === "cf")
    const references = cfLayer?.contribution.pendingReferences ?? []
    expect(references).toHaveLength(1)

    const sharedGraph = createSharedProjectValidationGraph(graph)
    const referenceBuffer = sharedGraph.reference.buffer
    let clock = 0
    const instrumentedGraph = {
      ...sharedGraph,
      reference: {
        stats: sharedGraph.reference.stats,
        get buffer() {
          clock += 10
          return referenceBuffer
        },
      },
    }
    const previousProfile = process.env["NKDK_PROFILE"]
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined)
    const now = vi.spyOn(performance, "now").mockImplementation(() => clock)
    let profileLines: string[] = []
    process.env["NKDK_PROFILE"] = "1"
    try {
      await runPreparedYamlProjectWorkerTask({
        kind: "validateSecondPass",
        workerIndex: 0,
        projectDir,
        context: mockContext,
        sharedProjectValidationGraph: instrumentedGraph,
        blockedComponentPaths: ["cfe/A", "cfe/B"],
        pendingReferenceLayers: [{ componentPath: "cf", references }],
      })
      profileLines = error.mock.calls.map(([line]) => String(line))
    } finally {
      if (previousProfile === undefined) delete process.env["NKDK_PROFILE"]
      else process.env["NKDK_PROFILE"] = previousProfile
      now.mockRestore()
      error.mockRestore()
    }

    const contextProfile = profileLine(profileLines, "Построение контекста worker")
    const referencesProfile = profileLine(profileLines, "Проверка ссылок")
    const secondPassProfile = profileLine(profileLines, "Worker second pass")
    expect(contextProfile).toContain("items=1")
    expect(profileTime(contextProfile)).toBeGreaterThan(0)
    expect(referencesProfile).toContain("items=1")
    expect(profileTime(referencesProfile)).toBe(0)
    expect(secondPassProfile).toContain("items=1")
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

function profileLine(lines: readonly string[], substep: string): string {
  const matches = lines.filter((line) => line.includes(`substep="${substep}"`))
  expect(matches).toHaveLength(1)
  return matches[0] ?? ""
}

function profileTime(line: string): number {
  const match = /\btime=([\d.]+)ms/.exec(line)
  if (match?.[1] === undefined) throw new Error(`В profile-записи отсутствует time: ${line}`)
  return Number(match[1])
}
