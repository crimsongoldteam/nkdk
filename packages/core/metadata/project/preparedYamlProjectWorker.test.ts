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
import { assertProjectStateFileUpdateBatch } from "../projectState/fileUpdate"
import {
  createPreparedYamlProjectWorkerPool,
  type PreparedYamlLocalValidationSource,
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

  it("локально проверяет переданные YAML bytes без повторного чтения и сохраняет переданный хэш", async () => {
    const projectDir = createTempDir()
    const file = componentProperties(projectDir, "cf", "ИзBytes")
    const hashBytes = Uint8Array.from([1, 2, 3, 4, 5, 6, 7, 8])

    const result = await runPreparedYamlProjectWorkerTask({
      kind: "validateLocal",
      workerIndex: 0,
      projectDir,
      context: mockContext,
      files: [{ descriptor: file, bytes: new TextEncoder().encode("{}\n") }],
      hashBytes,
    })

    expect(result.kind).toBe("validateLocalResult")
    if (result.kind !== "validateLocalResult") throw new Error("unexpected worker response")
    expect(result.parsedYamlFiles).toBe(1)
    expect(result.fileUpdateBatches).toHaveLength(1)
    expect(result.fileUpdateBatches[0]?.hashBytes).toEqual(hashBytes)
  })

  it("отклоняет локальную worker-задачу больше ограниченной producer-пачки", async () => {
    const projectDir = createTempDir()
    const descriptor = componentProperties(projectDir, "cf", "Ограничение")
    await expect(runPreparedYamlProjectWorkerTask({
      kind: "validateLocal",
      workerIndex: 0,
      projectDir,
      context: mockContext,
      files: Array.from({ length: 33 }, () => ({ descriptor, bytes: new TextEncoder().encode("{}\n") })),
      hashBytes: new Uint8Array(33 * 8),
    })).rejects.toThrow("не более 32 YAML")
  })

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

describe("local validation pool", () => {
  it("при ошибке init отменяет sibling tasks и ждёт их settlement с первой причиной", async () => {
    const projectDir = createTempDir()
    const primary = new Error("init one failed")
    const initCalls = [0, 0]
    let retry = false
    let initZeroSignal: AbortSignal | undefined
    let notifyZeroStarted!: () => void
    let notifyOneFailed!: () => void
    let releaseZero!: () => void
    const zeroStarted = new Promise<void>((resolve) => { notifyZeroStarted = resolve })
    const oneFailed = new Promise<void>((resolve) => { notifyOneFailed = resolve })
    const zeroGate = new Promise<void>((resolve) => { releaseZero = resolve })
    const operationController = new AbortController()
    const operation = {
      signal: operationController.signal,
      abort(reason: unknown) { operationController.abort(reason) },
    }
    const fake = {
      async run(input: PreparedYamlProjectWorkerTask, options?: { signal?: AbortSignal }) {
        if (input.kind !== "initValidation") throw new Error(`unexpected task: ${input.kind}`)
        initCalls[input.workerIndex] = (initCalls[input.workerIndex] ?? 0) + 1
        if (retry) return { kind: "initValidationResult", formMs: 0, propertiesMs: 0, totalMs: 0 }
        if (input.workerIndex === 0) {
          initZeroSignal = options?.signal
          notifyZeroStarted()
          await zeroGate
          throw new Error("late sibling failure")
        }
        await zeroStarted
        notifyOneFailed()
        throw primary
      },
      async destroy() {},
    }
    const pool = createPreparedYamlProjectWorkerPool({ concurrency: 2, createWorkerPool: () => fake })
    try {
      const running = pool.runLocalValidation({
        projectDir,
        context: mockContext,
        files: localValidationFiles(projectDir, "Init", 0),
        operation,
      }, {
        async writeBatch() {},
      })
      await oneFailed
      const earlyOutcome = await settlementWithin(running, 20)

      expect(initZeroSignal?.aborted).toBe(true)
      expect(earlyOutcome).toBe("pending")
      releaseZero()
      await expect(running).rejects.toBe(primary)
      retry = true
      await expect(pool.initValidation(mockContext)).resolves.toMatchObject({ schemaCompileMs: 0 })
      expect(initCalls).toEqual([2, 2])
    } finally {
      releaseZero()
      await pool.close()
    }
  })

  it("передаёт только выбранные YAML bytes и общий hashBytes, затем пишет полученную пачку producer", async () => {
    const projectDir = createTempDir()
    const selected = componentProperties(projectDir, "cf", "Выбранный")
    const bytes = new TextEncoder().encode("{}\n")
    const hashBytes = Uint8Array.from([1, 2, 3, 4, 5, 6, 7, 8])
    const transfers: Array<readonly ArrayBuffer[]> = []
    const validatedPaths: string[] = []
    const written: Array<{ updates: readonly { projectPath: string }[]; hashBytes: Uint8Array }> = []
    const fake = {
      async run(input: unknown) {
        const wrapper = input as { [valueSymbol]?: PreparedYamlProjectWorkerTask; [transferableSymbol]?: readonly ArrayBuffer[] }
        const task = wrapper[valueSymbol] ?? input as PreparedYamlProjectWorkerTask
        if (task.kind === "initValidation") return { kind: "initValidationResult", formMs: 0, propertiesMs: 0, totalMs: 0 }
        if (task.kind !== "validateLocal") throw new Error(`unexpected task: ${task.kind}`)
        transfers.push(wrapper[transferableSymbol] ?? [])
        validatedPaths.push(...task.files.map(({ descriptor }) => descriptor.rootProjectPath))
        expect(task.files.map(({ bytes: value }) => [...value])).toEqual([[...bytes]])
        return localValidationResult(task)
      },
      async destroy() {},
    }
    const pool = createPreparedYamlProjectWorkerPool({ concurrency: 1, createWorkerPool: () => fake })
    try {
      const result = await pool.runLocalValidation({
        projectDir,
        context: mockContext,
        files: {
          length: 1,
          createFile: () => ({ descriptor: selected, bytes, hashBytes }),
        },
      }, {
        async writeBatch(batch) { written.push(batch) },
      })

      expect(result.parsedYamlFiles).toBe(1)
      expect(validatedPaths).toEqual([selected.rootProjectPath])
      expect(transfers).toHaveLength(1)
      expect(transfers[0]).toHaveLength(2)
      expect(written).toHaveLength(1)
      expect(written[0]?.hashBytes).toEqual(hashBytes)
    } finally {
      await pool.close()
    }
  })

  it("отправляет ограниченные пачки последовательно с backpressure producer", async () => {
    const projectDir = createTempDir()
    const taskSizes: number[] = []
    const writtenSizes: number[] = []
    let releaseFirstWrite!: () => void
    let notifyFirstTask!: () => void
    const firstWrite = new Promise<void>((resolve) => { releaseFirstWrite = resolve })
    const firstTask = new Promise<void>((resolve) => { notifyFirstTask = resolve })
    const fake = successfulLocalValidationWorker((task) => {
      taskSizes.push(task.files.length)
      if (taskSizes.length === 1) notifyFirstTask()
    })
    const pool = createPreparedYamlProjectWorkerPool({ concurrency: 1, createWorkerPool: () => fake })
    const files = localValidationFiles(projectDir, "Файл", 65)
    try {
      const running = pool.runLocalValidation({ projectDir, context: mockContext, files }, {
        async writeBatch(batch) {
          writtenSizes.push(batch.updates.length)
          if (writtenSizes.length === 1) await firstWrite
        },
      })
      await firstTask
      expect(taskSizes).toEqual([32])
      releaseFirstWrite()

      await expect(running).resolves.toMatchObject({ parsedYamlFiles: 65 })
      expect(taskSizes).toEqual([32, 32, 1])
      expect(writtenSizes).toEqual([32, 32, 1])

      taskSizes.length = 0
      writtenSizes.length = 0
      await expect(pool.runLocalValidation({
        projectDir,
        context: mockContext,
        files: localValidationFiles(projectDir, "Файл", 64),
      }, {
        async writeBatch(batch) { writtenSizes.push(batch.updates.length) },
      })).resolves.toMatchObject({ parsedYamlFiles: 64 })
      expect(taskSizes).toEqual([32, 32])
      expect(writtenSizes).toEqual([32, 32])
    } finally {
      await pool.close()
    }
  })

  it("лениво создаёт не более одной DTO-пачки на lane до producer acknowledgement", async () => {
    const projectDir = createTempDir()
    let constructed = 0
    const constructedIndexes: number[] = []
    let writes = 0
    let notifyFirstWrites!: () => void
    let releaseWrites!: () => void
    const firstWrites = new Promise<void>((resolve) => { notifyFirstWrites = resolve })
    const writeGate = new Promise<void>((resolve) => { releaseWrites = resolve })
    const source: PreparedYamlLocalValidationSource = {
      length: 130,
      createFile(index) {
        constructed += 1
        constructedIndexes.push(index)
        return {
          descriptor: componentProperties(projectDir, "cf", `Lazy${index}`),
          bytes: new TextEncoder().encode("{}\n"),
          hashBytes: new Uint8Array(8),
        }
      },
    }
    const fake = successfulLocalValidationWorker()
    const pool = createPreparedYamlProjectWorkerPool({ concurrency: 2, createWorkerPool: () => fake })
    try {
      const running = pool.runLocalValidation({ projectDir, context: mockContext, files: source }, {
        async writeBatch() {
          writes += 1
          if (writes === 2) notifyFirstWrites()
          if (writes <= 2) await writeGate
        },
      })
      const earlyOutcome = await Promise.race([
        running.then(() => "fulfilled", () => "rejected"),
        firstWrites.then(() => "started" as const),
      ])

      expect(earlyOutcome).toBe("started")
      expect(constructed).toBe(64)
      releaseWrites()
      await expect(running).resolves.toMatchObject({ parsedYamlFiles: 130 })
      expect(constructed).toBe(130)
      expect(constructedIndexes.toSorted((left, right) => left - right)).toEqual(
        Array.from({ length: 130 }, (_unused, index) => index),
      )
    } finally {
      releaseWrites()
      await pool.close()
    }
  })

  it("после ошибки partition отменяет новые задачи и ждёт settlement начатого producer write", async () => {
    const projectDir = createTempDir()
    let workerZeroCalls = 0
    let workerOneCalls = 0
    let notifyWriteStarted!: () => void
    let notifyWriteCancelled!: () => void
    let releaseWriteSettlement!: () => void
    const writeStarted = new Promise<void>((resolve) => { notifyWriteStarted = resolve })
    const writeCancelled = new Promise<void>((resolve) => { notifyWriteCancelled = resolve })
    const writeSettlementGate = new Promise<void>((resolve) => { releaseWriteSettlement = resolve })
    const operationController = new AbortController()
    const operation = {
      signal: operationController.signal,
      abort(reason: unknown) {
        if (!operationController.signal.aborted) operationController.abort(reason)
      },
    }
    let writeSettled = false
    const localSignals: AbortSignal[] = []
    const fake = {
      async run(input: unknown, options?: { signal?: AbortSignal }) {
        const wrapper = input as { [valueSymbol]?: PreparedYamlProjectWorkerTask }
        const task = wrapper[valueSymbol] ?? input as PreparedYamlProjectWorkerTask
        if (task.kind === "initValidation") return { kind: "initValidationResult", formMs: 0, propertiesMs: 0, totalMs: 0 }
        if (task.kind !== "validateLocal") throw new Error(`unexpected task: ${task.kind}`)
        if (options?.signal !== undefined) localSignals.push(options.signal)
        if (task.workerIndex === 1) {
          workerOneCalls += 1
          await writeStarted
          throw new Error("partition failed")
        }
        workerZeroCalls += 1
        return localValidationResult(task)
      },
      async destroy() {},
    }
    const pool = createPreparedYamlProjectWorkerPool({ concurrency: 2, createWorkerPool: () => fake })
    const files = localValidationFiles(projectDir, "Settlement", 66)
    try {
      const running = pool.runLocalValidation({ projectDir, context: mockContext, files, operation }, {
        async writeBatch() {
          notifyWriteStarted()
          await new Promise<void>((_resolve, reject) => {
            operation.signal.addEventListener("abort", () => {
              notifyWriteCancelled()
              void writeSettlementGate.then(() => {
                writeSettled = true
                reject(operation.signal.reason)
              })
            }, { once: true })
          })
        },
      })
      await writeStarted
      await vi.waitFor(() => expect(workerOneCalls).toBe(1))
      await writeCancelled
      const earlyOutcome = await settlementWithin(running, 20)
      expect(earlyOutcome).toBe("pending")
      releaseWriteSettlement()

      await expect(running).rejects.toThrow("partition failed")
      await new Promise((resolve) => setTimeout(resolve, 20))
      expect(workerZeroCalls).toBe(1)
      expect(writeSettled).toBe(true)
      expect(localSignals).toHaveLength(2)
      expect(localSignals.every((signal) => signal === operation.signal)).toBe(true)
      expect(localSignals.every((signal) => signal.aborted)).toBe(true)
    } finally {
      releaseWriteSettlement()
      await pool.close()
    }
  })

  it("передаёт пользовательскую отмену через объединённый signal на границу Piscina", async () => {
    const projectDir = createTempDir()
    const controller = new AbortController()
    const failureController = new AbortController()
    const operation = {
      signal: AbortSignal.any([controller.signal, failureController.signal]),
      abort(reason: unknown) {
        if (!failureController.signal.aborted) failureController.abort(reason)
      },
    }
    let workerSignal: AbortSignal | undefined
    const boundarySignals: AbortSignal[] = []
    let notifyStarted!: () => void
    const started = new Promise<void>((resolve) => { notifyStarted = resolve })
    const fake = {
      async run(input: unknown, options?: { signal?: AbortSignal }) {
        const wrapper = input as { [valueSymbol]?: PreparedYamlProjectWorkerTask }
        const task = wrapper[valueSymbol] ?? input as PreparedYamlProjectWorkerTask
        if (options?.signal !== undefined) boundarySignals.push(options.signal)
        if (task.kind === "initValidation") return { kind: "initValidationResult", formMs: 0, propertiesMs: 0, totalMs: 0 }
        if (task.kind !== "validateLocal") throw new Error(`unexpected task: ${task.kind}`)
        const signal = options?.signal
        workerSignal = signal
        notifyStarted()
        if (signal === undefined) throw new Error("validateLocal task without AbortSignal")
        await new Promise<never>((_resolve, reject) => {
          signal.addEventListener("abort", () => reject(signal.reason), { once: true })
        })
      },
      async destroy() {},
    }
    const pool = createPreparedYamlProjectWorkerPool({ concurrency: 1, createWorkerPool: () => fake })
    let writes = 0
    try {
      const running = pool.runLocalValidation({
        projectDir,
        context: mockContext,
        files: {
          length: 1,
          createFile: () => ({
            descriptor: componentProperties(projectDir, "cf", "Отмена"),
            bytes: new TextEncoder().encode("{}\n"),
            hashBytes: new Uint8Array(8),
          }),
        },
        operation,
      }, {
        async writeBatch() { writes += 1 },
      })
      await started
      controller.abort()

      await expect(running).rejects.toMatchObject({ name: "AbortError" })
      expect(workerSignal).toBeDefined()
      expect(workerSignal).not.toBe(controller.signal)
      expect(workerSignal).toBe(operation.signal)
      expect(workerSignal?.aborted).toBe(true)
      expect(boundarySignals).toHaveLength(2)
      expect(boundarySignals.every((signal) => signal.aborted)).toBe(true)
      expect(writes).toBe(0)
    } finally {
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

function localValidationFiles(
  projectDir: string,
  prefix: string,
  count: number,
): PreparedYamlLocalValidationSource {
  return {
    length: count,
    createFile(index) {
      if (index < 0 || index >= count) throw new Error(`unexpected local validation index: ${index}`)
      return {
        descriptor: componentProperties(projectDir, "cf", `${prefix}${index}`),
        bytes: new TextEncoder().encode("{}\n"),
        hashBytes: new Uint8Array(8),
      }
    },
  }
}

function localValidationResult(task: Extract<PreparedYamlProjectWorkerTask, { kind: "validateLocal" }>) {
  return {
    kind: "validateLocalResult" as const,
    diagnostics: [],
    parsedYamlFiles: task.files.length,
    fileUpdateBatches: [{
      updates: task.files.map(({ descriptor }) => localYamlUpdate(descriptor.rootProjectPath)),
      hashBytes: task.hashBytes,
    }],
  }
}

function successfulLocalValidationWorker(
  onTask: (task: Extract<PreparedYamlProjectWorkerTask, { kind: "validateLocal" }>) => void = () => undefined,
) {
  return {
    async run(input: unknown) {
      const wrapper = input as { [valueSymbol]?: PreparedYamlProjectWorkerTask }
      const task = wrapper[valueSymbol] ?? input as PreparedYamlProjectWorkerTask
      if (task.kind === "initValidation") return { kind: "initValidationResult" as const, formMs: 0, propertiesMs: 0, totalMs: 0 }
      if (task.kind !== "validateLocal") throw new Error(`unexpected task: ${task.kind}`)
      onTask(task)
      return localValidationResult(task)
    },
    async destroy() {},
  }
}

async function settlementWithin(promise: Promise<unknown>, timeoutMs: number) {
  return Promise.race([
    promise.then(() => "fulfilled" as const, () => "rejected" as const),
    new Promise<"pending">((resolve) => setTimeout(() => resolve("pending"), timeoutMs)),
  ])
}

function localYamlUpdate(projectPath: string) {
  return {
    kind: "yaml" as const,
    projectPath,
    componentPath: "cf",
    resourceKind: "yaml" as const,
    yamlRole: "properties" as const,
    localValidation: { contributedFacts: false, diagnostics: [], schemaDiagnostics: [] },
    references: [],
    pendingReferences: [],
    owners: [],
    fields: [],
    forms: [],
    pendingChecks: [],
    dependencies: [],
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
