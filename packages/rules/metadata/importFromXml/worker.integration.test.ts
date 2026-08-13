import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import { transferableSymbol, valueSymbol } from "piscina"
import { mockXmlImportContext } from "../../tests/mockContext"
import type { ImportFirstPassResult } from "./types"
import { createBinaryProjectStateStore } from "../projectState/binary/store"
import { createProjectStateDependencyValidator } from "../validation/projectStateDependencyValidation"
import type { ProjectStateReadToken } from "../projectState/contracts"
import { createProjectStateFragmentWriter, openProjectStateFragment } from "../projectState/binary/fragment"
import { buildProjectStateSnapshot } from "../projectState/binary/builder"
import { ProjectStateSnapshotView } from "../projectState/binary/snapshot"
import { createBinaryProjectStateQueryPort } from "../projectState/binary/readSession"
import { resolveValidationProjectFile } from "../validation/projectFiles"
import { createProjectYamlCache } from "../validation/projectYamlCache"
import {
  createValidationSchemaCache,
  type ValidationSchemaCache,
  validateProjectFileFirstPass,
} from "../validation/projectValidationPasses"
import { createValidationRulesSnapshot } from "../validation/rulesSnapshot"
import {
  createImportFirstPassTransferable,
  createImportWorkerCommandRunner,
} from "./worker"
import { importDiagnostic, openImportBinaryResult } from "./binaryResult"
import type { ImportAssignment } from "./types"
import { createValidationProjectComponent } from "../validation/projectComponents"

const importWorker = createImportWorkerCommandRunner()
const runImportWorkerCommand = importWorker.run
const workerStateForTests = importWorker.stateForTests
const resetImportWorkerStateForTests = importWorker.resetForTests
const createFirstPassTransferable = createImportFirstPassTransferable

const syncXmlDir = join(import.meta.dirname, "../appliedObjects/configuration/__fixtures__/syncConfiguration/xml")
const catalogFullXmlPath = join(import.meta.dirname, "../appliedObjects/metadataCatalog/__fixtures__/full.xml")
const minimalFormXmlPath = join(import.meta.dirname, "../forms/clientApplicationForm/__fixtures__/minimal.xml")
const minimalFormMetadataXmlPath = join(
  import.meta.dirname,
  "../forms/clientApplicationForm/__fixtures__/minimalMetadata.xml"
)
const withDynamicListXmlPath = join(
  import.meta.dirname,
  "../forms/clientApplicationForm/__fixtures__/withDynamicList.xml"
)
const fullValidationSchemaCache = createValidationSchemaCache(mockXmlImportContext())
const fastValidationSchemaCache = {
  form: () => validSchema,
  properties: () => validSchema,
  compileAll: () => ({ formMs: 0, propertiesMs: 0, totalMs: 0 }),
} satisfies ValidationSchemaCache
let validationRulesSnapshot: ReturnType<typeof createValidationRulesSnapshot>
let configurationTopology: ReturnType<typeof createValidationProjectComponent>["topology"]
function requireTopologyNode(projectPattern: string) {
  const node = configurationTopology.assignments.find((candidate) => candidate.projectPattern === projectPattern)
  if (node === undefined) throw new Error(`Не найден topology-узел тестового задания: ${projectPattern}`)
  return node
}
let catalogTopologyNode: ReturnType<typeof requireTopologyNode>
let catalogFormTopologyNode: ReturnType<typeof requireTopologyNode>
let catalogValidationFile: NonNullable<ReturnType<typeof resolveValidationProjectFile>>
const tempDirs: string[] = []
const stateStores: Array<ReturnType<typeof createBinaryProjectStateStore>["store"]> = []
let sharedStateFixture: ReturnType<typeof createBinaryProjectStateStore> | undefined
let readyYamlValidationScenario: Awaited<ReturnType<typeof prepareReadyYamlValidationScenario>> | undefined

beforeAll(async () => {
  validationRulesSnapshot = createValidationRulesSnapshot(mockXmlImportContext())
  configurationTopology = createValidationProjectComponent(
    "/project",
    { kind: "configuration" },
  ).topology
  catalogTopologyNode = requireTopologyNode("Справочник/{ownerName}/Свойства.yaml")
  catalogFormTopologyNode = requireTopologyNode("Справочник/{ownerName}/Формы/{itemName}/Форма.yaml")
  const resolvedCatalogValidationFile = resolveValidationProjectFile(
    "/project",
    "/project/Справочник/Товары/Свойства.yaml",
  )
  if (resolvedCatalogValidationFile === undefined) throw new Error("Не удалось классифицировать тестовый YAML")
  catalogValidationFile = resolvedCatalogValidationFile
  fullValidationSchemaCache.properties(catalogValidationFile.owner.spec.rule)
  sharedStateFixture = createBinaryProjectStateStore({
    dependencyValidator: createProjectStateDependencyValidator(),
    projectDir: "/project",
  })
  stateStores.push(sharedStateFixture.store)
  readyYamlValidationScenario = await prepareReadyYamlValidationScenario()
})

beforeEach(async () => {
  resetImportWorkerStateForTests()
  await initializeWorker("/tmp/nkdk-import-worker-2")
})

afterAll(() => {
  for (const store of stateStores.splice(0)) store.close()
})

const validSchema = {
  Check: () => true,
  Errors: (): [boolean, []] => [true, []],
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
  resetImportWorkerStateForTests()
  for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

describe("XML import worker first pass", () => {
  it("keeps command runner state isolated between worker instances", async () => {
    const first = createImportWorkerCommandRunner()
    const second = createImportWorkerCommandRunner()
    const initialize = (operationId: string, workerIndex: number) => ({
      kind: "initialize" as const,
      operationId,
      workerIndex,
      context: mockXmlImportContext(),
      outputDir: `/tmp/${operationId}`,
    })
    const options = {
      persistentValidationState: {
        schemaCache: fastValidationSchemaCache,
        rulesSnapshot: validationRulesSnapshot,
      },
    }

    await first.run(initialize("first-runner", 1), options)
    await second.run(initialize("second-runner", 2), options)
    first.resetForTests()

    expect(first.stateForTests()).toEqual({ initialized: false, preparedYamlIds: [] })
    expect(second.stateForTests()).toMatchObject({
      initialized: true,
      operationId: "second-runner",
      workerIndex: 2,
    })
    second.resetForTests()
  })

  it("удерживает каждый основной YAML до общего индекса", async () => {
    const outputDir = createTempDir("all-yaml-deferred")
    const assignment = catalogAssignment()
    await initializeWorker(outputDir)

    const first = expectFirstPass(await runImportWorkerCommand({
      kind: "firstPass",
      assignments: [assignment],
    }))

    expect(first.diagnostics).toEqual([])
    expect(first.files.map(({ targetProjectPath }) => targetProjectPath))
      .not.toContain(assignment.targetProjectPath)
    expect(workerStateForTests().preparedYamlIds).toEqual([assignment.id])
    expect(existsSync(join(outputDir, assignment.targetProjectPath))).toBe(false)
  })

  it("writes deferred YAML and returns the complete local validation contribution", () => {
    const scenario = readyYamlValidationScenario
    if (scenario === undefined) throw new Error("Сценарий validation импортированного YAML не подготовлен")
    const {
      assignment,
      fileDiagnostics,
      importDiagnostics,
      outputDir,
      result,
      state,
      workerState,
      writtenFileExists,
    } = scenario

    expect(importDiagnostics.map(({ message }) => message)).not.toEqual(expect.arrayContaining([
      "Expected string",
      "Expected union value",
      'Отсутствует обязательное свойство "Тип"',
    ]))
    expect(importDiagnostics).toEqual(fileDiagnostics)

    expect(result.diagnostics).toEqual([])
    const fragments = result.configurationFragments
    expect(fragments).toEqual([
      expect.objectContaining({
        targetProjectPath: assignment.targetProjectPath,
        entities: expect.arrayContaining([
          expect.objectContaining({
            logicalAddress: assignment.logicalAddress,
            sourceProjectPath: assignment.targetProjectPath,
          }),
        ]),
      }),
    ])
    expect(fragments[0]).not.toHaveProperty("localDependencies")
    expect(JSON.stringify(fragments)).not.toMatch(
      /"xmlName"|"present"|"xsiNil"|"explicitEmpty"|"xsiType"|"xmlText"|"xmlPrefix"/u,
    )
    expect(result.stateFragment).toBeDefined()
    const imported = Array.from({ length: state.fileCount }, (_, fileId) => state.fileRecord(fileId))
      .find((file) => state.stringValue(file.projectPathId).endsWith(assignment.targetProjectPath))
    expect(imported?.hash).not.toBe(0n)
    expect(Object.keys(result).sort()).toEqual([
      "configurationFragments",
      "diagnostics",
      "files",
      "kind",
      "stateFragment",
      "warnings",
    ])
    expect(workerState).toMatchObject({
      operationId: "second-pass-test",
      workerIndex: 0,
      preparedYamlIds: [],
    })
    expect(result.files).toContainEqual({
      sourceKind: "worker",
      sourcePath: join(outputDir, assignment.targetProjectPath),
      targetProjectPath: assignment.targetProjectPath,
    })
    expect(writtenFileExists).toBe(true)
    expect(workerState).not.toHaveProperty("preparedModels")
    expect(workerState).not.toHaveProperty("preparedXml")
  })

  it("continues first pass after a task error and blocks no other parsing", async () => {
    const broken = catalogAssignment({
      id: "broken",
      itemName: "Сломанный",
      targetProjectPath: "Справочник/Сломанный/Свойства.yaml",
      logicalAddress: "Справочник.Сломанный",
      xmlFiles: [{ role: "metadata", sourcePath: join(syncXmlDir, "Catalogs/broken.xml") }],
    })
    const valid = catalogAssignment()

    const result = expectFirstPass(await runImportWorkerCommand({ kind: "firstPass", assignments: [broken, valid] }))

    expect(result.diagnostics).toHaveLength(1)
    expect(result.diagnostics[0]).toMatchObject({
      severity: "error",
      code: "xml_import_assignment_failed",
      sourcePath: expect.stringContaining("broken.xml"),
      targetProjectPath: broken.targetProjectPath,
    })
    expect(workerStateForTests().preparedYamlIds).toEqual([valid.id])
    expect(result.files.map(({ targetProjectPath }) => targetProjectPath)).not.toContain(valid.targetProjectPath)
    expect(result.configurationFragments).toHaveLength(1)
  })

  it("links a topology rule resolution error to the assignment metadata XML", async () => {
    const metadataPath = join(syncXmlDir, "Catalogs/Контрагенты.xml")
    const assignment = catalogAssignment({
      id: "unknown-model",
      topologyNodeId: "unknown-node",
      xmlFiles: [
        { role: "metadata", sourcePath: metadataPath },
        {
          role: "property",
          sourcePath: join(syncXmlDir, "Catalogs/Контрагенты/Forms/ФормаЭлемента/Ext/Form.xml"),
        },
      ],
    })

    const result = expectFirstPass(await runImportWorkerCommand({ kind: "firstPass", assignments: [assignment] }))

    expect(result.diagnostics).toEqual([
      expect.objectContaining({ sourcePath: metadataPath, targetProjectPath: assignment.targetProjectPath }),
    ])
  })

  it("передаёт все двоичные порции и не передаёт объектные сведения", () => {
    const fragmentWriter = createProjectStateFragmentWriter()
    const stateFragment = fragmentWriter.finish()
    const result: ImportFirstPassResult = {
      kind: "firstPassResult",
      diagnostics: [],
      files: [],
      configurationFragments: [],
      stateFragment,
    }

    const transferable = createFirstPassTransferable(result)

    expect(transferable[transferableSymbol]).toEqual(Object.values(stateFragment.buffers))
    expect(transferable[transferableSymbol].every((buffer) => buffer instanceof ArrayBuffer)).toBe(true)
    expect(transferable[valueSymbol]).toBe(result)
  })

  it("emits import profile records for worker first pass steps", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined)
    vi.stubEnv("NKDK_PROFILE", "1")

    await initializeWorker(createTempDir("profile"))
    expectFirstPass(await runImportWorkerCommand({ kind: "firstPass", assignments: [catalogAssignment()] }))
    const lines = error.mock.calls.map(([line]) => String(line))

    expect(
      lines.some(
        (line) =>
          line.includes("[nkdk-profile-step]") &&
          line.includes('operation="import-from-xml"') &&
          line.includes("scope=worker") &&
          line.includes("worker=0") &&
          line.includes('substep="Чтение XML"')
      )
    ).toBe(true)
    expect(lines.some((line) => line.includes("[nkdk-profile-step]") && line.includes('substep="Парсинг XML"'))).toBe(
      true
    )
    expect(lines.some((line) => line.includes('substep="Преобразование XML в YAML"'))).toBe(true)
    expect(lines.some((line) => line.includes('substep="Сбор локальных индексов"'))).toBe(true)
    expect(lines.some((line) => line.includes('substep="Извлечение данных для индекса конфигурации"'))).toBe(true)
    expect(lines.some((line) => line.includes('substep="Сериализация YAML"'))).toBe(false)
    expect(lines.some((line) => line.includes('substep="Запись основного YAML-файла"'))).toBe(false)
    expect(lines).toContainEqual(
      expect.stringMatching(/substep="YAML, ожидающие второго прохода".*items=1/)
    )
    expect(lines.some((line) => line.includes('substep="Досрочно записанные YAML"'))).toBe(false)
    const readLines = lines.filter((line) => line.includes('substep="Чтение XML"'))
    expect(readLines).toHaveLength(1)
    expect(readLines[0]).toContain("items=1")
    const serializationLines = lines.filter((line) => line.includes('substep="Сериализация YAML"'))
    expect(serializationLines).toHaveLength(0)
    expect(lines.some((line) => line.includes('substep="Построение модели"'))).toBe(false)
    expect(lines.some((line) => line.includes('substep="Экспорт модели в YAML-объект"'))).toBe(false)
  })

  it("завершает потоковый первый проход без возврата накопленных массивов", async () => {
    await initializeWorker(createTempDir("stream-finish-first"))
    await runImportWorkerCommand({ kind: "firstPassBatch", assignments: [catalogAssignment()] })

    expect(await runImportWorkerCommand({ kind: "finishFirstPass" })).toBeUndefined()
  })

  it("releases retained YAML on dispose", async () => {
    const assignments = createCatalogAndFormAssignments("Объект.Товары.LineNumber")
    await runImportWorkerCommand({ kind: "firstPass", assignments: [assignments.catalog, assignments.form] })

    await runImportWorkerCommand({ kind: "dispose" })

    expect(workerStateForTests().preparedYamlIds).toEqual([])
    expect(workerStateForTests().initialized).toBe(false)
  })

  it("удерживает форму до проверки совместимости DataPath", async () => {
    const outputDir = createTempDir("first-pass-form")
    const assignments = createCatalogAndFormAssignments("Объект.Товары.НомерСтроки")
    await initializeWorker(outputDir)

    const first = expectFirstPass(
      await runImportWorkerCommand({ kind: "firstPass", assignments: [assignments.catalog, assignments.form] })
    )

    expectDeferredFormFirstPass(first, assignments)
  })

  it("не генерирует внешний файл повторно, когда им владеет XML-выгрузка", async () => {
    const outputDir = createTempDir("first-pass-xml-owned-generated")
    const assignments = createCatalogAndFormAssignments("Неизвестный.LineNumber", "Товары", false, true)
    const targetProjectPath =
      "Справочник/Товары/Формы/ФормаЭлемента/ДинамическийСписок/ПроизвольныйЗапросМинимум.query"
    const sourcePath = join(createTempDir("external-query"), "ПроизвольныйЗапросМинимум.query")
    writeFileSync(sourcePath, "ВЫБРАТЬ 1", "utf-8")
    assignments.form.externalFiles = [{ sourcePath, targetProjectPath }]
    await initializeWorker(outputDir)

    const first = expectFirstPass(
      await runImportWorkerCommand({ kind: "firstPass", assignments: [assignments.catalog, assignments.form] })
    )

    expect(first.files.filter((file) => file.targetProjectPath === targetProjectPath)).toEqual([
      { sourceKind: "xml", sourcePath, targetProjectPath },
    ])
  })

})

describe("XML import worker second pass", () => {
  it("уточняет отсутствующий путь элемента формы после загрузки владельца", async () => {
    const outputDir = createTempDir("implicit-form-data-path")
    const assignments = createCatalogAndFormAssignments("", "Товары", false, false, "LabelField", "Код", false)
    await initializeWorker(outputDir)

    const first = expectFirstPass(await runImportWorkerCommand({
      kind: "firstPass",
      assignments: [assignments.catalog, assignments.form],
    }))

    expect(workerStateForTests().preparedYamlIds).toEqual([assignments.catalog.id, assignments.form.id])
    await runImportWorkerCommand({ kind: "beginSecondPass", readToken: createReadToken(first) })
    await runImportWorkerCommand({ kind: "secondPass", assignmentId: assignments.catalog.id })
    const second = await runImportWorkerCommand({ kind: "secondPass", assignmentId: assignments.form.id })
    await runImportWorkerCommand({ kind: "endSecondPass" })

    expect(second).toMatchObject({ kind: "secondPassResult", diagnostics: [] })
    if (second?.kind !== "secondPassResult") throw new Error("Ожидался secondPassResult")
    const formFile = second.files.find((file) => file.targetProjectPath === assignments.form.targetProjectPath)
    if (formFile === undefined) throw new Error("Ожидался файл формы")
    expect(readFileSync(formFile.sourcePath, "utf-8")).toContain('ПутьКДанным: ""')
  })

  it("выводит агрегированный профиль только после завершения прохода", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined)
    vi.stubEnv("NKDK_PROFILE", "1")
    const outputDir = createTempDir("second-pass-profile")
    const assignments = createCatalogAndFormAssignments("Неизвестный.LineNumber")
    await initializeWorker(outputDir)
    const first = expectFirstPass(await runImportWorkerCommand({
      kind: "firstPass",
      assignments: [assignments.catalog, assignments.form],
    }))
    await runImportWorkerCommand({ kind: "beginSecondPass", readToken: createReadToken(first) })
    error.mockClear()

    await runImportWorkerCommand({
      kind: "secondPassBatch",
      assignmentIds: [assignments.catalog.id, assignments.form.id],
    })
    expect(error).not.toHaveBeenCalled()

    const finished = await runImportWorkerCommand({ kind: "finishSecondPass" })
    expect(finished).toBeUndefined()
    const lines = error.mock.calls.map(([line]) => String(line)).filter((line) => line.startsWith("[nkdk-profile-step]"))
    expect(lines.length).toBeGreaterThan(0)
    expect(lines.filter((line) => line.includes('substep="Сериализация YAML"'))).toHaveLength(1)
  })

  it("отклоняет идентификатор задания, принадлежащий другой линии", async () => {
    const outputDir = createTempDir("foreign-assignment")
    await initializeWorker(outputDir)
    const first = expectFirstPass(await runImportWorkerCommand({
      kind: "firstPass",
      assignments: [catalogAssignment({ id: "owned" })],
    }))
    await runImportWorkerCommand({ kind: "beginSecondPass", readToken: createReadToken(first) })

    await expect(runImportWorkerCommand({
      kind: "secondPassBatch",
      assignmentIds: ["foreign"],
    })).rejects.toThrow("не принадлежит этой линии")
    await runImportWorkerCommand({ kind: "secondPass", assignmentId: "owned" })
    const finished = await runImportWorkerCommand({ kind: "finishSecondPass" })

    expect(finished).toBeUndefined()
  })

  it("writes a cross-object DataPath through the shared snapshot without reading a YAML project", async () => {
    const tempDir = createTempDir("worker")
    const projectDir = createTempDir("empty-project")
    const { assignments, first, second } = await runCatalogAndFormSecondPass(
      tempDir,
      "Объект.Товары.LineNumber",
      undefined,
      ({ assignments: firstPassAssignments }) => {
        expect(workerStateForTests().preparedYamlIds).toEqual([
          firstPassAssignments.catalog.id,
          firstPassAssignments.form.id,
        ])
      },
    )
    expectDeferredFormFirstPass(first, assignments, false)
    expect(second).toMatchObject({ kind: "secondPassResult", diagnostics: [], warnings: [] })
    if (second?.kind !== "secondPassResult") throw new Error("Ожидался secondPassResult")
    const formFile = second.files.find((file) => file.targetProjectPath === assignments.form.targetProjectPath)
    expect(formFile).toMatchObject({ sourceKind: "worker" })
    if (formFile === undefined) throw new Error("Ожидался файл формы")
    expect(readFileSync(formFile.sourcePath, "utf-8")).toContain("ПутьКДанным: Объект.Товары.НомерСтроки")
    const snapshot = buildProjectStateSnapshot({
      fragments: second.stateFragments.map(openProjectStateFragment),
      deletions: [],
    })
    expect(createBinaryProjectStateQueryPort(new ProjectStateSnapshotView(snapshot), {
      dependencyValidator: createProjectStateDependencyValidator(),
    }).resolveTargets([{
      requestId: "imported-form",
      componentPath: "cf",
      canonicalTarget: "Catalog.Товары.Form.ФормаЭлемента",
    }])[0]).toMatchObject({
      status: "found",
      target: {
        fileBacked: {
          itemProjectPath: "cf/Справочник/Товары/Формы/ФормаЭлемента",
          ownerProjectPath: "cf/Справочник/Товары/Свойства.yaml",
        },
      },
    })
    appendSharedStateFragments(second.stateFragments)
    expectSharedFormRoot(assignments.form.targetProjectPath, "Объект.Товары.НомерСтроки")
    expect(existsSync(join(projectDir, "Справочник", "Товары", "Свойства.yaml"))).toBe(false)
    expect(workerStateForTests().preparedYamlIds).toEqual([])
  })

  it("публикует структуру импортированной формы в окончательном ProjectState", async () => {
    const outputDir = createTempDir("structured-form")
    const { assignments, second } = await runCatalogAndFormSecondPass(
      outputDir,
      "Объект.Товары.LineNumber",
    )
    expect(second).toMatchObject({ diagnostics: [], warnings: [] })

    const snapshot = buildProjectStateSnapshot({
      fragments: second.stateFragments.map(openProjectStateFragment),
      deletions: [],
    })
    const query = createBinaryProjectStateQueryPort(new ProjectStateSnapshotView(snapshot), {
      dependencyValidator: createProjectStateDependencyValidator(),
    })

    expect(query.readStructuredDocumentEntries({
      componentPath: "cf",
      logicalAddress: assignments.form.logicalAddress,
    })).toEqual(expect.arrayContaining([
      expect.objectContaining({
        documentKind: "clientApplicationForm",
        representation: "working",
        componentKind: "element",
        name: "Путь",
      }),
      expect.objectContaining({ componentKind: "attribute", name: "Объект" }),
    ]))
  })

  it("writes a user DataPath after building the layered owner snapshot", async () => {
    const tempDir = createTempDir("worker-layered")
    const { assignments, first, second } = await runCatalogAndFormSecondPass(
      tempDir,
      "Объект.БазовыйРеквизит",
      "Базовый",
    )

    expect(second).toMatchObject({ kind: "secondPassResult", diagnostics: [], warnings: [] })
    if (second?.kind !== "secondPassResult") throw new Error("Ожидался secondPassResult")
    const formFile = second.files.find((file) => file.targetProjectPath === assignments.form.targetProjectPath)
    if (formFile === undefined) throw new Error("Ожидался файл формы")
    expect(readFileSync(formFile.sourcePath, "utf-8")).toContain("ПутьКДанным: Объект.БазовыйРеквизит")
    appendSharedStateFragments(second.stateFragments)
    expectSharedFormRoot(assignments.form.targetProjectPath, "Объект.БазовыйРеквизит")
    expect(first.files.map(({ targetProjectPath }) => targetProjectPath)).not.toContain(assignments.form.targetProjectPath)
  })

  it("preserves an unresolved DataPath, returns one warning and releases the YAML", async () => {
    const tempDir = createTempDir("worker")
    const { assignments, second } = await runCatalogAndFormSecondPass(
      tempDir,
      "Объект.НеизвестныйПереход.LineNumber",
    )

    expect(second).toMatchObject({
      kind: "secondPassResult",
      diagnostics: [],
      warnings: [
        {
          severity: "warning",
          code: "unresolved_data_path",
          targetProjectPath: assignments.form.targetProjectPath,
          value: "Объект.НеизвестныйПереход.LineNumber",
        },
      ],
    })
    if (second?.kind !== "secondPassResult") throw new Error("Ожидался secondPassResult")
    const formFile = second.files.find((file) => file.targetProjectPath === assignments.form.targetProjectPath)
    if (formFile === undefined) throw new Error("Ожидался файл формы")
    expect(readFileSync(formFile.sourcePath, "utf-8")).toContain("ПутьКДанным: Объект.НеизвестныйПереход.LineNumber")
    expect(workerStateForTests().preparedYamlIds).toEqual([])
  })

  it("продолжает второй проход после ошибки записи YAML", async () => {
    const tempDir = createTempDir("worker")
    const blocked = catalogAssignment({ id: "blocked" })
    const valid = catalogAssignment({
      id: "valid",
      itemName: "Валидный",
      logicalAddress: "Справочник.Валидный",
      targetProjectPath: "Справочник/Валидный/Свойства.yaml",
    })
    await initializeWorker(tempDir)
    const blockedCatalogPath = join(tempDir, blocked.targetProjectPath)
    mkdirSync(blockedCatalogPath, { recursive: true })

    const first = expectFirstPass(
      await runImportWorkerCommand({ kind: "firstPass", assignments: [blocked, valid] })
    )

    expect(first.diagnostics).toEqual([])
    expect(workerStateForTests().preparedYamlIds).toEqual([blocked.id, valid.id])

    await runImportWorkerCommand({ kind: "beginSecondPass", readToken: createReadToken(first) })
    const second = await runImportWorkerCommand({
      kind: "secondPassBatch",
      assignmentIds: [blocked.id, valid.id],
    })
    await runImportWorkerCommand({ kind: "endSecondPass" })

    const view = openImportBinaryResult(second)

    expect(view.diagnostics.count).toBe(1)
    expect(importDiagnostic(view.diagnostics, 0)).toMatchObject({
      severity: "error",
      code: "xml_import_yaml_failed",
      targetProjectPath: blocked.targetProjectPath,
    })
    expect(Array.from({ length: view.files.count }, (_, index) => view.files.file(index))).toContainEqual(
      expect.objectContaining({ sourceKind: "worker", targetProjectPath: valid.targetProjectPath }),
    )
    expect(workerStateForTests().preparedYamlIds).toEqual([])
  })
})

function catalogAssignment(overrides: Partial<ImportAssignment> = {}): ImportAssignment {
  return {
    id: "catalog",
    role: "properties",
    topologyNodeId: catalogTopologyNode.id,
    targetProjectPath: "Справочник/Контрагенты/Свойства.yaml",
    itemType: "MetadataCatalog",
    itemName: "Контрагенты",
    logicalAddress: "Справочник.Контрагенты",
    owner: undefined,
    xmlFiles: [{ role: "metadata", sourcePath: join(syncXmlDir, "Catalogs/Контрагенты.xml") }],
    externalFiles: [],
    ...overrides,
  }
}

function expectFirstPass(result: Awaited<ReturnType<typeof runImportWorkerCommand>>): ImportFirstPassResult {
  if (result?.kind !== "firstPassResult") throw new Error("Ожидался firstPassResult")
  return result
}

function expectDeferredFormFirstPass(
  first: ImportFirstPassResult,
  assignments: ReturnType<typeof createCatalogAndFormAssignments>,
  checkWorkerState = true,
): void {
  expect(first.diagnostics).toEqual([])
  expect(first.files.map(({ targetProjectPath }) => targetProjectPath)).not.toContain(assignments.catalog.targetProjectPath)
  expect(first.files.map(({ targetProjectPath }) => targetProjectPath)).not.toContain(assignments.form.targetProjectPath)
  if (checkWorkerState) {
    expect(workerStateForTests().preparedYamlIds).toEqual([assignments.catalog.id, assignments.form.id])
  }
}

async function initializeWorker(
  outputDir: string,
  schemaCache: ValidationSchemaCache = fastValidationSchemaCache,
): Promise<void> {
  await runImportWorkerCommand({
    kind: "initialize",
    operationId: "second-pass-test",
    workerIndex: 0,
    context: mockXmlImportContext(),
    outputDir,
  }, {
    persistentValidationState: { schemaCache, rulesSnapshot: validationRulesSnapshot },
  })
}

function createReadToken(first: { readonly stateFragment?: ImportFirstPassResult["stateFragment"] }): ProjectStateReadToken {
  const fixture = sharedStateFixture
  if (fixture === undefined) throw new Error("ProjectState test fixture не инициализирована")
  fixture.store.beginUpdate()
  if (first.stateFragment !== undefined) fixture.store.appendFragment(first.stateFragment)
  fixture.store.commitUpdate()
  return fixture.store.createReadToken()
}

async function prepareReadyYamlValidationScenario() {
  const outputDir = createTempDir("first-pass-ready")
  await initializeWorker(outputDir, fullValidationSchemaCache)
  const assignment = catalogAssignment({
    itemName: "СправочникПолный",
    targetProjectPath: "Справочник/СправочникПолный/Свойства.yaml",
    logicalAddress: "Справочник.СправочникПолный",
    xmlFiles: [{ role: "metadata", sourcePath: catalogFullXmlPath }],
  })
  const first = expectFirstPass(await runImportWorkerCommand({ kind: "firstPass", assignments: [assignment] }))
  await runImportWorkerCommand({ kind: "beginSecondPass", readToken: createReadToken(first) })
  const second = await runImportWorkerCommand({ kind: "secondPass", assignmentId: assignment.id })
  await runImportWorkerCommand({ kind: "endSecondPass" })
  if (second?.kind !== "secondPassResult") throw new Error("Ожидался secondPassResult")
  const result = { ...second, configurationFragments: first.configurationFragments }

  createReadToken(result)
  const fixture = sharedStateFixture
  if (fixture === undefined) throw new Error("ProjectState test fixture не инициализирована")
  const importDiagnostics = fixture.store.readLocalDiagnostics()
    .filter(({ filePath }) => filePath.endsWith(assignment.targetProjectPath))
  const context = mockXmlImportContext()
  const file = resolveValidationProjectFile(outputDir, join(outputDir, assignment.targetProjectPath))
  if (file === undefined) throw new Error("Не удалось классифицировать импортированный YAML")
  const fromFile = validateProjectFileFirstPass({
    projectDir: outputDir,
    file,
    cache: createProjectYamlCache(),
    context,
    schemaCache: createValidationSchemaCache(context),
    rulesSnapshot: createValidationRulesSnapshot(context),
  })
  const fileDiagnostics = fromFile.diagnostics.map((diagnostic) => ({
    ...diagnostic,
    filePath: `cf/${assignment.targetProjectPath}`,
  }))
  if (result.stateFragment === undefined) throw new Error("Ожидался вклад состояния импортированного YAML")

  return {
    assignment,
    fileDiagnostics,
    importDiagnostics,
    outputDir,
    result,
    state: openProjectStateFragment(result.stateFragment),
    workerState: workerStateForTests(),
    writtenFileExists: existsSync(join(outputDir, assignment.targetProjectPath)),
  }
}

function appendSharedStateFragments(stateFragments: ImportFirstPassResult["stateFragment"][]): void {
  const fixture = sharedStateFixture
  if (fixture === undefined) throw new Error("ProjectState test fixture не инициализирована")
  fixture.store.beginUpdate()
  for (const stateFragment of stateFragments) {
    if (stateFragment !== undefined) fixture.store.appendFragment(stateFragment)
  }
  fixture.store.commitUpdate()
}

function expectSharedFormRoot(targetProjectPath: string, value: string): void {
  const fixture = sharedStateFixture
  if (fixture === undefined) throw new Error("ProjectState test fixture не инициализирована")
  const session = fixture.openReadSession(fixture.store.createReadToken())
  const dependency = session.readDependencyInputs([{
    requestId: "form-index",
    componentPath: "cf",
    projectPath: `cf/${targetProjectPath}`,
    check: {
      kind: "dataPath",
      yamlPath: ["ПутьКДанным"],
      location: { line: 1, col: 1 },
      owner: { kind: "Справочник", name: "Товары" },
      value,
      tagged: false,
      policyInput: { yaml: "ПутьКДанным" },
      policy: "formDataPath",
    },
  }])[0]
  session.close()
  expect(dependency).toMatchObject({
    status: "found",
    input: { forms: expect.arrayContaining([expect.objectContaining({ kind: "root", name: "Объект" })]) },
  })
}

async function runCatalogAndFormSecondPass(
  outputDir: string,
  dataPath: string,
  objectTypeName?: string,
  onFirstPass?: (result: {
    readonly assignments: ReturnType<typeof createCatalogAndFormAssignments>
    readonly first: ImportFirstPassResult
  }) => void,
  elementTag = "LabelField",
) {
  const assignments = createCatalogAndFormAssignments(dataPath, objectTypeName, false, false, elementTag)
  await initializeWorker(outputDir)
  const first = expectFirstPass(await runImportWorkerCommand({
    kind: "firstPass",
    assignments: [assignments.catalog, assignments.form],
  }))
  onFirstPass?.({ assignments, first })
  await runImportWorkerCommand({ kind: "beginSecondPass", readToken: createReadToken(first) })
  const secondResults = []
  for (const assignmentId of [assignments.catalog.id, assignments.form.id]) {
    const result = await runImportWorkerCommand({ kind: "secondPass", assignmentId })
    if (result?.kind === "secondPassResult") secondResults.push(result)
  }
  await runImportWorkerCommand({ kind: "endSecondPass" })
  const second = {
    kind: "secondPassResult" as const,
    diagnostics: secondResults.flatMap(({ diagnostics }) => diagnostics),
    warnings: secondResults.flatMap(({ warnings }) => warnings),
    files: secondResults.flatMap(({ files }) => files),
    stateFragments: secondResults.flatMap(({ stateFragment }) => stateFragment === undefined ? [] : [stateFragment]),
  }
  return { assignments, first, second }
}

function createCatalogAndFormAssignments(
  dataPath: string,
  objectTypeName = "Товары",
  includeUsualGroup = false,
  includeDynamicList = false,
  elementTag = "LabelField",
  elementName = "Путь",
  includeDataPath = true
): { catalog: ImportAssignment; form: ImportAssignment } {
  const sourceDir = createTempDir("sources")
  const catalogXmlPath = join(sourceDir, "Товары.xml")
  const formMetadataPath = join(sourceDir, "Форма.xml")
  const formBodyPath = join(sourceDir, "Form.xml")
  writeFileSync(
    catalogXmlPath,
    readFileSync(catalogFullXmlPath, "utf-8")
      .replaceAll("СправочникПолный", "Товары")
      .replaceAll("ТабличнаяЧасть", "Товары"),
    "utf-8"
  )
  writeFileSync(formMetadataPath, readFileSync(minimalFormMetadataXmlPath, "utf-8"), "utf-8")
  const dataPathXml = includeDataPath ? `\n\t\t\t<DataPath>${dataPath}</DataPath>` : ""
  const labelField = `<${elementTag} name="${elementName}" id="2">${dataPathXml}
\t\t\t<ContextMenu name="ПутьКонтекстноеМеню" id="3"/>
\t\t\t<ExtendedTooltip name="ПутьРасширеннаяПодсказка" id="4"/>
\t\t</${elementTag}>`
  const formElement = includeUsualGroup
    ? `<UsualGroup name="Группа" id="5">
\t\t\t<Title><v8:item><v8:lang>ru</v8:lang><v8:content>Группа</v8:content></v8:item></Title>
\t\t\t<VerticalStretch>false</VerticalStretch>
\t\t\t<Group>Vertical</Group>
\t\t\t<ShowTitle>false</ShowTitle>
\t\t\t<ExtendedTooltip name="ГруппаРасширеннаяПодсказка" id="6"/>
\t\t\t<ChildItems>
\t\t\t\t${labelField.replaceAll("\n", "\n\t\t\t\t")}
\t\t\t</ChildItems>
\t\t</UsualGroup>`
    : labelField
  writeFileSync(
    formBodyPath,
    readFileSync(includeDynamicList ? withDynamicListXmlPath : minimalFormXmlPath, "utf-8")
      .replace(
        '<AutoCommandBar name="ФормаКоманднаяПанель" id="-1"/>',
        `<AutoCommandBar name="ФормаКоманднаяПанель" id="-1"/>
\t<ChildItems>
\t\t${formElement.replaceAll("\n", "\n\t\t")}
\t</ChildItems>`
      )
      .replace(
        "<Attributes/>",
        `<Attributes>
\t\t<Attribute name="Объект" id="1">
\t\t\t<Type><v8:Type>cfg:CatalogObject.${objectTypeName}</v8:Type></Type>
\t\t\t<MainAttribute>true</MainAttribute>
\t\t</Attribute>
\t</Attributes>`
      ),
    "utf-8"
  )

  const catalog = catalogAssignment({
    id: "catalog-products",
    itemName: "Товары",
    targetProjectPath: "Справочник/Товары/Свойства.yaml",
    logicalAddress: "Справочник.Товары",
    xmlFiles: [{ role: "metadata", sourcePath: catalogXmlPath }],
  })
  const form: ImportAssignment = {
    id: "catalog-products-form",
    role: "fileItem",
    topologyNodeId: catalogFormTopologyNode.id,
    targetProjectPath: "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml",
    itemType: "ClientApplicationForm",
    itemName: "ФормаЭлемента",
    logicalAddress: "Справочник.Товары.Форма.ФормаЭлемента",
    owner: { itemType: "MetadataCatalog", name: "Товары", logicalAddress: "Справочник.Товары" },
    xmlFiles: [
      { role: "metadata", sourcePath: formMetadataPath },
      { role: "body", sourcePath: formBodyPath },
    ],
    externalFiles: [],
  }
  return { catalog, form }
}

function createTempDir(name: string): string {
  const dir = mkdtempSync(join(tmpdir(), `nkdk-import-${name}-`))
  tempDirs.push(dir)
  return dir
}
