import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest"
import { transferableSymbol, valueSymbol } from "piscina"
import { mockContext } from "../../tests/mockContext"
import { evaluateProjectFirstPass } from "../validation/projectFirstPassReadiness"
import { createValidationRulesSnapshot } from "../validation/rulesSnapshot"
import { createTestValidationSchemaCache } from "../validation/tests/testValidationSchemaCache"
import { hashFileBytes } from "../configurationIndex/hash"
import {
  openProjectStateFileUpdateBatch,
} from "../projectState/binary/contribution"
import { createProjectStateFragmentWriter } from "../projectState/binary/fragment"
import {
  createProjectStateRefreshBinaryResult,
  openProjectStateRefreshBinaryResult,
} from "./projectStateRefreshBinaryResult"
import type { ProjectStateFileIdentity } from "../projectState/fileUpdate"
import type { ProjectStateValidationFileBatch } from "../projectState/refresh"
import type { MetadataWorkerOperation } from "../workerPool/types"
import type { PreparedYamlProjectFileDescriptor } from "./preparedYamlProject"
import {
  createPreparedYamlProjectWorkerPool,
} from "./preparedYamlProjectWorkerPool"
import preparedYamlProjectWorkerEntryPoint, {
  classifyChangedProjectStateFile,
  collectValidationFacts,
  projectFormStructureDocuments,
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
  it("возвращает отдельный двоичный фрагмент для каждой рабочей пачки", async () => {
    const createTask = (projectPath: string): PreparedYamlProjectWorkerTask => ({
      kind: "refreshProjectState",
      workerIndex: 0,
      projectDir: "/project",
      context: mockContext,
      files: [{
        projectPath,
        componentPath: "cf",
        identity: { projectPath, componentPath: "cf", resourceKind: "resource" },
        absolutePath: `/project/${projectPath}`,
      }],
      knownHashBits: new Uint8Array(1),
      expectedHashBytes: new Uint8Array(8),
    })
    const dependencies = {
      readFile: async () => Uint8Array.of(1),
      hashBytes: () => 1n,
    }

    const first = openProjectStateRefreshBinaryResult(
      await runPreparedYamlProjectWorkerTask(createTask("cf/Первый.bin"), dependencies),
    )
    const second = openProjectStateRefreshBinaryResult(
      await runPreparedYamlProjectWorkerTask(createTask("cf/Второй.bin"), dependencies),
    )

    expect(first.fragmentView.fileCount).toBe(1)
    expect(first.fragmentView.stringValue(first.fragmentView.fileRecord(0).projectPathId)).toBe("cf/Первый.bin")
    expect(second.fragmentView.fileCount).toBe(1)
    expect(second.fragmentView.stringValue(second.fragmentView.fileRecord(0).projectPathId)).toBe("cf/Второй.bin")
  })

  it("профилирует Б1–Б4 одной записью на подпункт", async () => {
    const projectDir = createTempDir()
    const descriptors = [
      componentProperties(projectDir, "cf", "ПервыйПрофиль"),
      componentProperties(projectDir, "cf", "ВторойПрофиль"),
    ]
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined)
    const previousProfile = process.env["NKDK_PROFILE"]
    let lines: string[] = []
    process.env["NKDK_PROFILE"] = "1"
    try {
      await runPreparedYamlProjectWorkerTask(yamlRefreshTask(projectDir, descriptors), {
        readFile: async () => new TextEncoder().encode("{}\n"),
        hashBytes: () => 9n,
      })
      lines = error.mock.calls
        .map(([line]) => String(line))
        .filter((line) => line.includes('step="Обработка файлов Б1–Б4"'))
    } finally {
      if (previousProfile === undefined) delete process.env["NKDK_PROFILE"]
      else process.env["NKDK_PROFILE"] = previousProfile
      error.mockRestore()
    }

    const substeps = [
      "Чтение файлов",
      "Вычисление хэшей",
      "Сравнение хэшей",
      "Разбор YAML",
      "Локальная проверка YAML",
      "Сбор сведений файла",
      "Двоичное кодирование результата",
    ]
    for (const substep of substeps) {
      const matching = lines.filter((line) => line.includes(`substep="${substep}"`))
      expect(matching).toHaveLength(1)
      expect(matching[0]).toContain("items=2")
    }
  })

  it("читает и хэширует изменённый resource внутри worker", async () => {
    const absolutePath = "/project/cf/Логотип.bin"
    const readCalls: string[] = []
    const target = {
      kind: "member" as const,
      canonical: "Document.Заказ.Template.Печать",
      fileBacked: {
        itemProjectPath: "cf/Документ/Заказ/Шаблоны/Печать",
        ownerProjectPath: "cf/Документ/Заказ/Свойства.yaml",
      },
    }

    const result = await runPreparedYamlProjectWorkerTask({
      kind: "refreshProjectState",
      workerIndex: 0,
      projectDir: "/project",
      context: mockContext,
      files: [{
        projectPath: "cf/Логотип.bin",
        componentPath: "cf",
        identity: { projectPath: "cf/Логотип.bin", componentPath: "cf", resourceKind: "resource" },
        absolutePath,
        targets: [target],
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
    const refresh = openProjectStateRefreshBinaryResult(result)
    expect(refresh).toMatchObject({
      missingProjectPaths: [],
      hashedFiles: 1,
      parsedYamlFiles: 0,
      changedFiles: 1,
    })
    const fragment = refresh.fragmentView
    expect(fragment.stringValue(fragment.fileRecord(0).projectPathId)).toBe("cf/Логотип.bin")
    expect(fragment.fileRecord(0).hash).toBe(0x0102030405060708n)
    expect(fragment.tableRange("targets")?.records).toBe(1)
  })

  it("не классифицирует известный файл при совпадении хэша", async () => {
    const classify = vi.fn()
    const expectedHashBytes = new Uint8Array(8)
    new DataView(expectedHashBytes.buffer).setBigUint64(0, 9n, false)

    const result = await runPreparedYamlProjectWorkerTask({
      kind: "refreshProjectState",
      workerIndex: 0,
      projectDir: "/project",
      context: mockContext,
      files: [{
        projectPath: "cf/Известный.bin",
        componentPath: "cf",
        absolutePath: "/project/cf/Известный.bin",
      }],
      knownHashBits: Uint8Array.of(1),
      expectedHashBytes,
    }, {
      readFile: async () => Uint8Array.of(1),
      hashBytes: () => 9n,
      classifyProjectStateFile: classify,
    })

    expect(classify).not.toHaveBeenCalled()
    const refresh = openProjectStateRefreshBinaryResult(result)
    expect(refresh).toMatchObject({ hashedFiles: 1, parsedYamlFiles: 0, changedFiles: 0 })
    expect(refresh.fragmentView.fileCount).toBe(0)
  })

  it("один раз классифицирует изменённый известный YAML и проверяет прочитанные байты", async () => {
    const projectDir = createTempDir()
    const descriptor = componentProperties(projectDir, "cf", "ИзвестныйWorker")
    const identity: ProjectStateFileIdentity = {
      projectPath: descriptor.rootProjectPath,
      componentPath: "cf",
      resourceKind: "yaml",
      yamlRole: "properties",
    }
    const bytes = new TextEncoder().encode("{}\n")
    const classify = vi.fn(() => ({ identity, descriptor, targets: [] }))

    const result = await runPreparedYamlProjectWorkerTask({
      kind: "refreshProjectState",
      workerIndex: 0,
      projectDir,
      context: mockContext,
      files: [{
        projectPath: identity.projectPath,
        componentPath: identity.componentPath,
        absolutePath: descriptor.filePath,
      }],
      knownHashBits: Uint8Array.of(1),
      expectedHashBytes: new Uint8Array(8),
    }, {
      readFile: async () => bytes,
      hashBytes: (value) => {
        expect(value).toBe(bytes)
        return 9n
      },
      classifyProjectStateFile: classify,
    })

    expect(classify).toHaveBeenCalledTimes(1)
    const refresh = openProjectStateRefreshBinaryResult(result)
    expect(refresh).toMatchObject({ hashedFiles: 1, parsedYamlFiles: 1, changedFiles: 1 })
    const fragment = refresh.fragmentView
    expect(fragment.stringValue(fragment.fileRecord(0).projectPathId)).toBe(identity.projectPath)
  })

  it("восстанавливает описание изменённого известного пути из topology worker", () => {
    const projectDir = createTempDir()
    const descriptor = componentProperties(projectDir, "cf", "КлассифицированныйWorker")

    expect(classifyChangedProjectStateFile({
      projectPath: descriptor.rootProjectPath,
      componentPath: "cf",
      absolutePath: descriptor.filePath,
    }, projectDir)).toMatchObject({
      identity: { projectPath: descriptor.rootProjectPath, resourceKind: "yaml", yamlRole: "properties" },
      descriptor: { rootProjectPath: descriptor.rootProjectPath },
    })
    expect(() => classifyChangedProjectStateFile({
      projectPath: "cf/Неизвестный/Файл.txt",
      componentPath: "cf",
      absolutePath: join(projectDir, "cf", "Неизвестный", "Файл.txt"),
    }, projectDir)).toThrow("Сохранённый путь больше не принадлежит проекту")
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
        projectPath: descriptor.rootProjectPath,
        componentPath: descriptor.componentPath,
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

    const refresh = openProjectStateRefreshBinaryResult(result)
    const fragment = refresh.fragmentView
    expect(fragment.stringValue(fragment.fileRecord(0).projectPathId)).toBe(descriptor.rootProjectPath)
    expect(refresh).toMatchObject({ hashedFiles: 1, parsedYamlFiles: 1, changedFiles: 1 })
  })

  it("собирает изменённые YAML одной worker-пачки в один нормализованный результат", async () => {
    const projectDir = createTempDir()
    const descriptors = [
      componentProperties(projectDir, "cf", "ПервыйWorker"),
      componentProperties(projectDir, "cf", "ВторойWorker"),
    ]

    const result = await runPreparedYamlProjectWorkerTask(yamlRefreshTask(projectDir, descriptors), {
      readFile: async () => new TextEncoder().encode("{}\n"),
      hashBytes: () => 9n,
    })

    const fragment = openProjectStateRefreshBinaryResult(result).fragmentView
    expect(Array.from({ length: fragment.fileCount }, (_, index) =>
      fragment.stringValue(fragment.fileRecord(index).projectPathId))).toEqual(
      descriptors.map(({ rootProjectPath }) => rootProjectPath),
    )
  })

  it("возвращает исчезнувший после discovery путь без повтора чтения", async () => {
    const missing = Object.assign(new Error("missing"), { code: "ENOENT" })

    const result = await runPreparedYamlProjectWorkerTask({
      kind: "refreshProjectState",
      workerIndex: 0,
      projectDir: "/project",
      context: mockContext,
      files: [{
        projectPath: "cf/Исчез.bin",
        componentPath: "cf",
        identity: { projectPath: "cf/Исчез.bin", componentPath: "cf", resourceKind: "resource" },
        absolutePath: "/project/cf/Исчез.bin",
      }],
      knownHashBits: Uint8Array.of(1),
      expectedHashBytes: new Uint8Array(8),
    }, {
      readFile: async () => { throw missing },
    })

    const refresh = openProjectStateRefreshBinaryResult(result)
    expect(refresh).toMatchObject({
      missingProjectPaths: ["cf/Исчез.bin"],
      hashedFiles: 0,
      parsedYamlFiles: 0,
      changedFiles: 0,
    })
    expect(refresh.fragmentView.fileCount).toBe(0)
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
    const encodedFileUpdateBatch = result.fileUpdateBatches[0]!
    const fileUpdateBatch = openProjectStateFileUpdateBatch(encodedFileUpdateBatch)
    expect(fileUpdateBatch.fileCount).toBe(3)
    expect(Array.from({ length: fileUpdateBatch.fileCount }, (_, index) => fileUpdateBatch.projectPath(index))).toEqual([
      "cf/Справочник/Основная/Свойства.yaml",
      "cfe/Продажи/Справочник/Продажи/Свойства.yaml",
      "cfe/Склад/Справочник/Склад/Свойства.yaml",
    ])
    expect(Array.from({ length: fileUpdateBatch.fileCount }, (_, index) => fileUpdateBatch.hash(index)))
      .toEqual(Array(3).fill(hashFileBytes(Buffer.from("{}\n"))))
    expect(structuredClone(encodedFileUpdateBatch)).toEqual(encodedFileUpdateBatch)
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
    const update = openProjectStateFileUpdateBatch(batch).update(0)
    if (update?.kind !== "yaml") throw new Error("unexpected project state update")

    expect(update.pendingChecks).toEqual([
      expect.objectContaining({
        policyInput: expect.objectContaining({ yaml: "ПутьКДанным" }),
      }),
    ])
    expect(update.pendingChecks[0]).not.toHaveProperty("rule")
    expect(update.pendingChecks[0]).not.toHaveProperty("index")
    expect(update.structuredDocuments).toEqual(expect.arrayContaining([
      expect.objectContaining({
        documentKind: "clientApplicationForm",
        representation: "working",
        logicalAddress: "Справочник.Товары.Форма.ФормаЭлемента",
        workingProjectPath: projectPath,
        componentKind: "attribute",
        name: "Значение",
        yamlPath: ["Реквизиты", "Значение"],
      }),
    ]))
    expect(structuredClone(batch)).toEqual(batch)
  }, 120_000)

  it("публикует основу формы отдельно и не добавляет её обычные факты", async () => {
    const projectDir = createTempDir()
    const componentPath = "cfe/Продажи"
    const componentDir = join(projectDir, "cfe", "Продажи")
    const workingProjectPath = "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml"
    const projectPath = "Справочник/Товары/Формы/ФормаЭлемента/БазоваяФорма.yaml"
    const filePath = join(componentDir, ...projectPath.split("/"))
    mkdirSync(dirname(filePath), { recursive: true })
    writeFileSync(filePath, [
      "Реквизиты:",
      "  Объект:",
      "    Тип: Строка",
      "Элементы:",
      "  Поле:",
      "    Вид: ПолеВвода",
      "    ПутьКДанным: Объект",
      "",
    ].join("\n"))
    const descriptor: PreparedYamlProjectFileDescriptor = {
      componentPath,
      componentDir,
      rootProjectPath: `${componentPath}/${projectPath}`,
      projectPath,
      filePath,
      role: "form",
      owner: { dir: "Справочник", name: "Товары" },
      itemType: "ClientApplicationForm",
      indexContribution: "isolated",
    }

    const result = await runPreparedYamlProjectWorkerTask({
      kind: "validateFirstPass",
      workerIndex: 0,
      projectDir,
      context: mockContext,
      files: [descriptor],
    })
    if (result.kind !== "validateFirstPassResult") throw new Error("unexpected worker response")
    const update = openProjectStateFileUpdateBatch(result.fileUpdateBatches[0]!).update(0)
    if (update?.kind !== "yaml") throw new Error("unexpected project state update")

    expect(update).toMatchObject({
      targets: [], owners: [], fields: [], forms: [], pendingReferences: [], pendingChecks: [], dependencies: [],
      localValidation: { contributedFacts: false },
    })
    expect(update.structuredDocuments).toEqual(expect.arrayContaining([
      expect.objectContaining({
        representation: "base",
        logicalAddress: "Справочник.Товары.Форма.ФормаЭлемента",
        workingProjectPath,
        componentKind: "element",
        name: "Поле",
      }),
      expect.objectContaining({ componentKind: "attribute", name: "Объект" }),
    ]))
  }, 120_000)

  it("определяет роль формы через topology, а не имя файла", () => {
    const projectDir = createTempDir()
    const componentPath = "cfe/Продажи"
    const componentDir = join(projectDir, "cfe", "Продажи")
    const projectPath = "ОбщаяФорма/РабочийСтол/БазоваяФорма.yaml"
    const documents = projectFormStructureDocuments({
      projectDir,
      descriptor: {
        componentPath,
        componentDir,
        rootProjectPath: `${componentPath}/${projectPath}`,
        projectPath,
        filePath: join(componentDir, ...projectPath.split("/")),
        role: "form",
        owner: { dir: "ОбщаяФорма", name: "РабочийСтол" },
        itemType: "ClientApplicationForm",
        indexContribution: "isolated",
      },
      components: [{ componentKind: "parameter", name: "Режим", yamlPath: ["Параметры", "Режим"] }],
    })

    expect(documents).toEqual(expect.arrayContaining([
      expect.objectContaining({
        representation: "base",
        logicalAddress: "ОбщаяФорма.РабочийСтол",
        workingProjectPath: "ОбщаяФорма/РабочийСтол/Свойства.yaml",
      }),
    ]))
  })

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
      result.fileUpdateBatches.map(({ bytes }) => bytes.buffer)
    )
    const received = structuredClone(result, { transfer: [...movable[transferableSymbol]] })
    expect(result.fileUpdateBatches[0]!.bytes.byteLength).toBe(0)
    if (received.kind !== "validateFirstPassResult") throw new Error("unexpected transferred response")
    expect(openProjectStateFileUpdateBatch(received.fileUpdateBatches[0]!).fileCount).toBe(1)
  }, 120_000)

  it("передаёт все секции refresh как владеющие ArrayBuffer", async () => {
    const projectDir = createTempDir()
    const absolutePath = join(projectDir, "cf", "resource.bin")
    mkdirSync(dirname(absolutePath), { recursive: true })
    writeFileSync(absolutePath, "data")

    const boundaryResult = await preparedYamlProjectWorkerEntryPoint({
      kind: "refreshProjectState",
      workerIndex: 0,
      projectDir,
      context: mockContext,
      files: [{
        projectPath: "cf/resource.bin",
        componentPath: "cf",
        identity: { projectPath: "cf/resource.bin", componentPath: "cf", resourceKind: "resource" },
        absolutePath,
      }],
      knownHashBits: new Uint8Array(1),
      expectedHashBytes: new Uint8Array(8),
    })
    const movable = boundaryResult as unknown as {
      readonly [transferableSymbol]: readonly ArrayBuffer[]
      readonly [valueSymbol]: typeof boundaryResult
    }
    const result = movable[valueSymbol]
    if (result.kind !== "binaryResult") throw new Error("unexpected worker response")

    expect(movable[transferableSymbol]).toEqual(result.buffers.map(({ buffer }) => buffer))
    const received = structuredClone(result, { transfer: [...movable[transferableSymbol]] })
    expect(result.buffers.every(({ buffer }) => buffer.byteLength === 0)).toBe(true)
    expect(openProjectStateRefreshBinaryResult(received).fragmentView.fileCount).toBe(1)
  })

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
  it("передаёт универсальному worker само задание без Piscina-оболочки", async () => {
    const projectDir = createTempDir()
    const identity = {
      projectPath: "cf/resource.bin",
      componentPath: "cf",
      resourceKind: "resource" as const,
    }
    const tasks: PreparedYamlProjectWorkerTask[] = []
    const operation: MetadataWorkerOperation = {
      id: "validation",
      concurrency: 1,
      async run(_workerIndex, command) {
        if (command.kind !== "validation") throw new Error("unexpected command")
        tasks.push(command.task)
        if (command.task.kind === "initValidation") {
          return { kind: "initValidationResult", formMs: 0, propertiesMs: 0, totalMs: 0 }
        }
        if (command.task.kind !== "refreshProjectState") throw new Error(`unexpected task: ${command.task.kind}`)
        return successfulRefreshResult(command.task)
      },
      async finish() {},
    }
    const pool = createPreparedYamlProjectWorkerPool({ concurrency: 1, operation })

    await runSingleResourceRefresh(pool, projectDir, identity)

    const refresh = tasks.find((task) => task.kind === "refreshProjectState")
    expect(refresh).toMatchObject({ kind: "refreshProjectState", files: [expect.objectContaining({ projectPath: identity.projectPath })] })
    await pool.close()
  })

  it("профилирует применение пачек одной агрегированной записью", async () => {
    const projectDir = createTempDir()
    const identity = {
      projectPath: "cf/resource.bin",
      componentPath: "cf",
      resourceKind: "resource" as const,
    }
    const fake = createRefreshPoolFake(() => undefined)
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined)
    const previousProfile = process.env["NKDK_PROFILE"]
    const pool = createPreparedYamlProjectWorkerPool({ concurrency: 1, createWorkerPool: () => fake })
    let profileLines: string[] = []
    process.env["NKDK_PROFILE"] = "1"
    try {
      await runSingleResourceRefresh(pool, projectDir, identity)
      profileLines = error.mock.calls.map(([line]) => String(line))
    } finally {
      await pool.close()
      if (previousProfile === undefined) delete process.env["NKDK_PROFILE"]
      else process.env["NKDK_PROFILE"] = previousProfile
      error.mockRestore()
    }

    const matching = profileLines.filter((line) =>
      line.includes('step="Обработка файлов Б1–Б4"')
      && line.includes('substep="Применение двоичных фрагментов"')
    )
    expect(matching).toHaveLength(1)
    expect(matching[0]).toContain("items=1")
  })

  it("передаёт фрагмент каждой пачки и не задерживает worker его применением", async () => {
    const projectDir = createTempDir()
    const files = Array.from({ length: 129 }, (_unused, index) => ({
      identity: {
        projectPath: `cf/${index}.bin`,
        componentPath: "cf",
        resourceKind: "resource" as const,
      },
      absolutePath: join(projectDir, "cf", `${index}.bin`),
    }))
    const taskSizes: number[] = []
    const secondTask = Promise.withResolvers<void>()
    const firstWrite = Promise.withResolvers<void>()
    const writeStarted = Promise.withResolvers<void>()
    const fake = createRefreshPoolFake((task) => {
      taskSizes.push(task.files.length)
      if (taskSizes.length === 2) secondTask.resolve()
    })
    const pool = createPreparedYamlProjectWorkerPool({ concurrency: 1, createWorkerPool: () => fake })
    let writes = 0
    try {
      const running = pool.runProjectStateRefresh({
        projectDir,
        context: mockContext,
        source: { batches: validationBatches(files) },
      }, {
        async writeFragment() {
          writes += 1
          if (writes === 1) {
            writeStarted.resolve()
            await firstWrite.promise
          }
        },
        async deleteFiles() {},
      })

      await writeStarted.promise
      await secondTask.promise
      expect(taskSizes).toEqual([128, 1])
      firstWrite.resolve()
      await expect(running).resolves.toEqual({
        hashedFiles: 129,
        parsedYamlFiles: 0,
        changedFiles: 129,
        missingFiles: 0,
      })
      expect(writes).toBe(2)
    } finally {
      await pool.close()
    }
  })

  it("применяет удалённые пути из двоичной пачки", async () => {
    const projectDir = createTempDir()
    const removed = "cf/Удалён.bin"
    const fake = createRefreshPoolFake(
      () => undefined,
      () => createProjectStateRefreshBinaryResult({
          fragment: createProjectStateFragmentWriter().finish(),
          missingProjectPaths: [removed],
          hashedFiles: 0,
          parsedYamlFiles: 0,
          changedFiles: 0,
      }),
    )
    const pool = createPreparedYamlProjectWorkerPool({ concurrency: 1, createWorkerPool: () => fake })
    const deleted: string[] = []
    try {
      const result = await pool.runProjectStateRefresh({
        projectDir,
        context: mockContext,
        source: { batches: validationBatches([{
          identity: { projectPath: removed, componentPath: "cf", resourceKind: "resource" },
          absolutePath: join(projectDir, removed),
        }]) },
      }, {
        async writeFragment() {},
        async deleteFiles(paths) { deleted.push(...paths) },
      })

      expect(deleted).toEqual([removed])
      expect(result).toMatchObject({ missingFiles: 1, changedFiles: 0 })
    } finally {
      await pool.close()
    }
  })

  it("не запрашивает следующую пачку, пока единственный worker занят", async () => {
    const projectDir = createTempDir()
    const files = [0, 1].map((index) => ({
      identity: { projectPath: `cf/${index}.bin`, componentPath: "cf", resourceKind: "resource" as const },
      absolutePath: join(projectDir, "cf", `${index}.bin`),
    }))
    let releaseFirst!: () => void
    let notifyFirstStarted!: () => void
    const firstReleased = new Promise<void>((resolve) => { releaseFirst = resolve })
    const firstStarted = new Promise<void>((resolve) => { notifyFirstStarted = resolve })
    let secondRequested = false
    let calls = 0
    const fake = createRefreshPoolFake(async () => {
      calls += 1
      if (calls === 1) {
        notifyFirstStarted()
        await firstReleased
      }
    })
    const batches = (async function* () {
      for await (const batch of validationBatches([files[0]!])) yield batch
      secondRequested = true
      for await (const batch of validationBatches([files[1]!])) yield batch
    })()
    const pool = createPreparedYamlProjectWorkerPool({ concurrency: 1, createWorkerPool: () => fake })
    try {
      const running = pool.runProjectStateRefresh({ projectDir, context: mockContext, source: { batches } }, {
        async writeFragment() {},
        async deleteFiles() {},
      })
      await firstStarted
      expect(secondRequested).toBe(false)
      releaseFirst()
      await expect(running).resolves.toMatchObject({ hashedFiles: 2 })
      expect(secondRequested).toBe(true)
    } finally {
      await pool.close()
    }
  })

  it("держит не больше одной активной пачки на каждый из четырёх worker", async () => {
    const projectDir = createTempDir()
    const files = Array.from({ length: 9 }, (_unused, index) => ({
      identity: { projectPath: `cf/${index}.bin`, componentPath: "cf", resourceKind: "resource" as const },
      absolutePath: join(projectDir, "cf", `${index}.bin`),
    }))
    let active = 0
    let maxActive = 0
    const processed: string[] = []
    const pool = createPreparedYamlProjectWorkerPool({
      concurrency: 4,
      createWorkerPool: () => createRefreshPoolFake(async (task) => {
        active += 1
        maxActive = Math.max(maxActive, active)
        processed.push(...task.files.map(({ projectPath }) => projectPath))
        await new Promise<void>((resolve) => setTimeout(resolve, 0))
        active -= 1
      }),
    })
    const batches = (async function* () {
      for (const file of files) yield* validationBatches([file])
    })()

    try {
      await expect(pool.runProjectStateRefresh({
        projectDir,
        context: mockContext,
        source: { batches },
      }, {
        async writeFragment() {},
        async deleteFiles() {},
      })).resolves.toMatchObject({ hashedFiles: 9 })

      expect(maxActive).toBe(4)
      expect(processed.sort()).toEqual(files.map(({ identity }) => identity.projectPath).sort())
    } finally {
      await pool.close()
    }
  })
})

function runSingleResourceRefresh(
  pool: ReturnType<typeof createPreparedYamlProjectWorkerPool>,
  projectDir: string,
  identity: ProjectStateFileIdentity,
) {
  return pool.runProjectStateRefresh({
    projectDir,
    context: mockContext,
    source: { batches: validationBatches([{ identity, absolutePath: join(projectDir, identity.projectPath) }]) },
  }, {
    async writeFragment() {},
    async deleteFiles() {},
  })
}

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

function yamlRefreshTask(
  projectDir: string,
  descriptors: readonly ReturnType<typeof componentProperties>[],
): PreparedYamlProjectWorkerTask {
  return {
    kind: "refreshProjectState",
    workerIndex: 0,
    projectDir,
    context: mockContext,
    files: descriptors.map((descriptor) => ({
      projectPath: descriptor.rootProjectPath,
      componentPath: descriptor.componentPath,
      identity: {
        projectPath: descriptor.rootProjectPath,
        componentPath: descriptor.componentPath,
        resourceKind: "yaml" as const,
        yamlRole: descriptor.role,
      },
      absolutePath: descriptor.filePath,
      descriptor,
    })),
    knownHashBits: new Uint8Array(Math.ceil(descriptors.length / 8)),
    expectedHashBytes: new Uint8Array(descriptors.length * 8),
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

async function* validationBatches(
  files: ReadonlyArray<{
    readonly identity: ProjectStateFileIdentity
    readonly absolutePath: string
    readonly descriptor?: PreparedYamlProjectFileDescriptor
  }>,
): AsyncGenerator<ProjectStateValidationFileBatch> {
  for (let offset = 0; offset < files.length; offset += 128) {
    const batch = files.slice(offset, offset + 128)
    yield {
      files: batch.map((file) => ({
        ...file,
        projectPath: file.identity.projectPath,
        componentPath: file.identity.componentPath,
      })),
      knownHashBits: new Uint8Array(Math.ceil(batch.length / 8)),
      hashBytes: new Uint8Array(batch.length * 8),
      previousFileIds: new Int32Array(batch.length).fill(-1),
      storedFileCount: 0,
    }
  }
}

function createRefreshPoolFake(
  onTask: (task: Extract<PreparedYamlProjectWorkerTask, { kind: "refreshProjectState" }>) => void | Promise<void>,
  createResult: (
    task: Extract<PreparedYamlProjectWorkerTask, { kind: "refreshProjectState" }>,
  ) => ReturnType<typeof createProjectStateRefreshBinaryResult> = successfulRefreshResult,
) {
  return {
    async run(input: unknown) {
      const wrapper = input as { [valueSymbol]?: PreparedYamlProjectWorkerTask }
      const task = wrapper[valueSymbol] ?? input as PreparedYamlProjectWorkerTask
      if (task.kind === "initValidation") return { kind: "initValidationResult", formMs: 0, propertiesMs: 0, totalMs: 0 }
      if (task.kind !== "refreshProjectState") throw new Error(`unexpected task: ${task.kind}`)
      await onTask(task)
      return createResult(task)
    },
    async destroy() {},
  }
}

function successfulRefreshResult(
  task: Extract<PreparedYamlProjectWorkerTask, { kind: "refreshProjectState" }>,
) {
  const fragmentWriter = createProjectStateFragmentWriter()
  task.files.forEach(({ identity }) => {
    if (identity === undefined) throw new Error("test fake ожидает новый классифицированный файл")
    fragmentWriter.appendFile({ ...identity, kind: "resource", targets: [] }, 1n)
  })
  return createProjectStateRefreshBinaryResult({
    fragment: fragmentWriter.finish(),
    missingProjectPaths: [],
    hashedFiles: task.files.length,
    parsedYamlFiles: 0,
    changedFiles: task.files.length,
  })
}
