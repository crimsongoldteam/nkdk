import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest"
import { transferableSymbol, valueSymbol } from "piscina"
import { mockContext } from "../../tests/mockContext"
import { evaluateProjectFirstPass } from "../validation/projectFirstPassReadiness"
import { createValidationRulesSnapshot } from "../validation/rulesSnapshot"
import { createTestValidationSchemaCache } from "../validation/testing/testValidationSchemaCache"
import { hashFileBytes } from "../configurationIndex/hash"
import { assertProjectStateFileUpdateBatch, createProjectStateFileUpdateBatch } from "../projectState/fileUpdate"
import {
  createPreparedYamlProjectWorkerPool,
} from "./preparedYamlProjectWorkerPool"
import preparedYamlProjectWorkerEntryPoint, {
  collectValidationFacts,
  runPreparedYamlProjectWorkerTask,
  type PreparedYamlProjectWorkerTask,
} from "./preparedYamlProjectWorker"

const tempDirs: string[] = []

beforeAll(async () => {
  await runPreparedYamlProjectWorkerTask({
    kind: "initValidation",
    workerIndex: 0,
    context: mockContext,
    rulesSnapshot: createValidationRulesSnapshot(mockContext),
  }, {
    createValidationSchemaCache: async () => createTestValidationSchemaCache(),
  })
})

afterEach(() => {
  for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

describe("project-state refresh worker", () => {
  it("читает и хэширует изменённый resource внутри worker", async () => {
    const absolutePath = "/project/cf/Логотип.bin"
    const readCalls: string[] = []

    const result = await runPreparedYamlProjectWorkerTask({
      kind: "refreshProjectState",
      workerIndex: 0,
      projectDir: "/project",
      context: mockContext,
      files: [{
        identity: { projectPath: "cf/Логотип.bin", componentPath: "cf", resourceKind: "resource" },
        absolutePath,
      }],
      knownHashBits: new Uint8Array(1),
      expectedHashBytes: new Uint8Array(8),
    }, {
      async readFile(path: string) {
        readCalls.push(path)
        return Uint8Array.from([1, 2, 3])
      },
      hashBytes: () => 0x0102030405060708n,
    })

    expect(readCalls).toEqual([absolutePath])
    expect(result).toEqual({
      kind: "refreshProjectStateResult",
      fileUpdateBatches: [{
        updates: [{
          kind: "resource",
          projectPath: "cf/Логотип.bin",
          componentPath: "cf",
          resourceKind: "resource",
        }],
        hashBytes: Uint8Array.from([1, 2, 3, 4, 5, 6, 7, 8]),
      }],
      missingProjectPaths: [],
      hashedFiles: 1,
      parsedYamlFiles: 0,
      changedFiles: 1,
    })
    expect(result).not.toHaveProperty("bytes")
  })

  it("проверяет изменённый YAML из тех же прочитанных байтов", async () => {
    const projectDir = createTempDir()
    const descriptor = componentProperties(projectDir, "cf", "ТоварыWorker")
    const bytes = new TextEncoder().encode("{}\n")

    const result = await runPreparedYamlProjectWorkerTask({
      kind: "refreshProjectState",
      workerIndex: 0,
      projectDir,
      context: mockContext,
      files: [{
        identity: {
          projectPath: descriptor.rootProjectPath,
          componentPath: descriptor.componentPath,
          resourceKind: "yaml",
          yamlRole: descriptor.role,
        },
        absolutePath: descriptor.filePath,
        descriptor,
      }],
      knownHashBits: new Uint8Array(1),
      expectedHashBytes: new Uint8Array(8),
    }, {
      readFile: async () => bytes,
      hashBytes: (value) => {
        expect(value).toBe(bytes)
        return 9n
      },
    })

    expect(result.kind).toBe("refreshProjectStateResult")
    if (result.kind !== "refreshProjectStateResult") return
    expect(result.fileUpdateBatches).toHaveLength(1)
    expect(result.fileUpdateBatches[0]?.updates).toEqual([
      expect.objectContaining({ kind: "yaml", projectPath: descriptor.rootProjectPath }),
    ])
    expect(result).toMatchObject({ hashedFiles: 1, parsedYamlFiles: 1, changedFiles: 1 })
  })

  it("возвращает исчезнувший после discovery путь без повтора чтения", async () => {
    const missing = Object.assign(new Error("missing"), { code: "ENOENT" })

    const result = await runPreparedYamlProjectWorkerTask({
      kind: "refreshProjectState",
      workerIndex: 0,
      projectDir: "/project",
      context: mockContext,
      files: [{
        identity: { projectPath: "cf/Исчез.bin", componentPath: "cf", resourceKind: "resource" },
        absolutePath: "/project/cf/Исчез.bin",
      }],
      knownHashBits: Uint8Array.of(1),
      expectedHashBytes: new Uint8Array(8),
    }, {
      readFile: async () => { throw missing },
    })

    expect(result).toEqual({
      kind: "refreshProjectStateResult",
      fileUpdateBatches: [],
      missingProjectPaths: ["cf/Исчез.bin"],
      hashedFiles: 0,
      parsedYamlFiles: 0,
      changedFiles: 0,
    })
  })
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
    expect(result.fileUpdateBatches).toHaveLength(1)
    const fileUpdateBatch = result.fileUpdateBatches[0]!
    expect(fileUpdateBatch.updates).toHaveLength(3)
    expect(fileUpdateBatch.updates.map(({ projectPath }) => projectPath)).toEqual([
      "cf/Справочник/Основная/Свойства.yaml",
      "cfe/Продажи/Справочник/Продажи/Свойства.yaml",
      "cfe/Склад/Справочник/Склад/Свойства.yaml",
    ])
    expect(fileUpdateBatch.hashBytes).toEqual(
      Uint8Array.from(
        [hashFileBytes(Buffer.from("{}\n")), hashFileBytes(Buffer.from("{}\n")), hashFileBytes(Buffer.from("{}\n"))]
          .flatMap((hash) => [...Buffer.from(hash.toString(16).padStart(16, "0"), "hex")])
      )
    )
    expect(() => assertProjectStateFileUpdateBatch(fileUpdateBatch)).not.toThrow()
    expect(structuredClone(fileUpdateBatch)).toEqual(fileUpdateBatch)
  }, 120_000)

  it("returns portable form checks without rule objects or index functions", async () => {
    const projectDir = createTempDir()
    const componentDir = join(projectDir, "cf")
    const projectPath = "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml"
    const filePath = join(componentDir, ...projectPath.split("/"))
    mkdirSync(dirname(filePath), { recursive: true })
    writeFileSync(
      filePath,
      [
        "Реквизиты:",
        "  Значение:",
        "    Тип: Строка",
        "Элементы:",
        "  Поле:",
        "    Вид: ПолеВвода",
        "    ПутьКДанным: Значение",
        "",
      ].join("\n")
    )
    const result = await runPreparedYamlProjectWorkerTask({
      kind: "validateFirstPass",
      workerIndex: 0,
      projectDir,
      context: mockContext,
      files: [
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
    if (result.kind !== "validateFirstPassResult") throw new Error("unexpected worker response")
    const batch = result.fileUpdateBatches[0]!
    const update = batch.updates[0]
    if (update?.kind !== "yaml") throw new Error("unexpected project state update")

    expect(update.pendingChecks).toEqual([
      expect.objectContaining({
        policyInput: expect.objectContaining({ yaml: "ПутьКДанным" }),
      }),
    ])
    expect(update.pendingChecks[0]).not.toHaveProperty("rule")
    expect(update.pendingChecks[0]).not.toHaveProperty("index")
    expect(() => assertProjectStateFileUpdateBatch(batch)).not.toThrow()
    expect(structuredClone(batch)).toEqual(batch)
  }, 120_000)

  it("declares only shared hash buffers at the Piscina worker boundary", async () => {
    const projectDir = createTempDir()
    const file = componentProperties(projectDir, "cf", "Товары")
    mkdirSync(dirname(file.filePath), { recursive: true })
    writeFileSync(file.filePath, "{}\n")

    const boundaryResult = await preparedYamlProjectWorkerEntryPoint({
      kind: "validateFirstPass",
      workerIndex: 0,
      projectDir,
      context: mockContext,
      files: [file],
    })
    const movable = boundaryResult as unknown as {
      readonly [transferableSymbol]: readonly ArrayBuffer[]
      readonly [valueSymbol]: typeof boundaryResult
    }

    expect(movable[transferableSymbol]).toBeDefined()
    const result = movable[valueSymbol]
    if (result.kind !== "validateFirstPassResult") throw new Error("unexpected worker response")
    expect(movable[transferableSymbol]).toEqual(
      result.fileUpdateBatches.map(({ hashBytes }) => hashBytes.buffer)
    )
  }, 120_000)

  it("leaves non-first-pass worker results outside the Piscina transfer wrapper", async () => {
    const result = await preparedYamlProjectWorkerEntryPoint({
      kind: "prepare",
      workerIndex: 0,
      projectDir: createTempDir(),
      itemTypeByYamlDir: {},
      files: [],
      includeYamlData: false,
    })

    expect(result).toEqual({
      kind: "prepareResult",
      yamlFiles: [],
      declarations: [],
      dependencies: [],
      diagnostics: [],
    })
    expect((result as unknown as { [transferableSymbol]?: unknown })[transferableSymbol]).toBeUndefined()
  })

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

describe("project-state refresh pool", () => {
  it("не запускает следующую пачку lane до записи предыдущего результата", async () => {
    const projectDir = createTempDir()
    const files = Array.from({ length: 65 }, (_unused, index) => ({
      identity: {
        projectPath: `cf/${index}.bin`,
        componentPath: "cf",
        resourceKind: "resource" as const,
      },
      absolutePath: join(projectDir, "cf", `${index}.bin`),
    }))
    const taskSizes: number[] = []
    let releaseFirstWrite!: () => void
    let notifyFirstTask!: () => void
    const firstWrite = new Promise<void>((resolve) => { releaseFirstWrite = resolve })
    const firstTask = new Promise<void>((resolve) => { notifyFirstTask = resolve })
    const fake = {
      async run(input: unknown) {
        const wrapper = input as { [valueSymbol]?: PreparedYamlProjectWorkerTask }
        const task = wrapper[valueSymbol] ?? input as PreparedYamlProjectWorkerTask
        if (task.kind === "initValidation") return { kind: "initValidationResult", formMs: 0, propertiesMs: 0, totalMs: 0 }
        if (task.kind !== "refreshProjectState") throw new Error(`unexpected task: ${task.kind}`)
        taskSizes.push(task.files.length)
        if (taskSizes.length === 1) notifyFirstTask()
        const batch = createProjectStateFileUpdateBatch(task.files.map(({ identity }) => ({
          update: { ...identity, kind: "resource" },
          hash: 1n,
        })))
        return {
          kind: "refreshProjectStateResult",
          fileUpdateBatches: [batch],
          missingProjectPaths: [],
          hashedFiles: task.files.length,
          parsedYamlFiles: 0,
          changedFiles: task.files.length,
        }
      },
      async destroy() {},
    }
    const pool = createPreparedYamlProjectWorkerPool({ concurrency: 1, createWorkerPool: () => fake })
    let writes = 0
    try {
      const running = pool.runProjectStateRefresh({
        projectDir,
        context: mockContext,
        source: {
          files,
          baseline: {
            knownHashBits: new Uint8Array(Math.ceil(files.length / 8)),
            hashBytes: new Uint8Array(files.length * 8),
            deleted: [],
          },
        },
      }, {
        async writeBatch() {
          writes += 1
          if (writes === 1) await firstWrite
        },
        async deleteFiles() {},
      })

      await firstTask
      expect(taskSizes).toEqual([32])
      releaseFirstWrite()
      await expect(running).resolves.toEqual({
        hashedFiles: 65,
        parsedYamlFiles: 0,
        changedFiles: 65,
        missingFiles: 0,
      })
      expect(taskSizes).toEqual([32, 32, 1])
    } finally {
      releaseFirstWrite()
      await pool.close()
    }
  })
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
