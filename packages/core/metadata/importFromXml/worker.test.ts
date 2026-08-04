import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import { transferableSymbol, valueSymbol } from "piscina"
import { mockXmlImportContext } from "../../tests/mockContext"
import type { ImportFirstPassResult } from "./types"
import { createBinaryProjectStateStore } from "../projectState/binary/store"
import type { ProjectStateReadToken } from "../projectState/contracts"
import { createProjectStateFragmentWriter, openProjectStateFragment } from "../projectState/binary/fragment"
import {
  createFirstPassTransferable,
  resetImportWorkerStateForTests,
  runImportWorkerCommand,
  setImportWorkerSchemaCacheForTests,
  workerStateForTests,
} from "./worker"
import type { ImportAssignment } from "./types"
import { serializeImportYaml } from "./writeOutput"

const syncXmlDir = join(import.meta.dirname, "../appliedObjects/configuration/__fixtures__/syncConfiguration/xml")
const catalogFullXmlPath = join(import.meta.dirname, "../appliedObjects/metadataCatalog/__fixtures__/full.xml")
const minimalNumeratorXmlPath = join(
  import.meta.dirname,
  "../appliedObjects/metadataDocumentNumerator/__fixtures__/minimal.xml"
)
const minimalFormXmlPath = join(import.meta.dirname, "../forms/clientApplicationForm/__fixtures__/minimal.xml")
const minimalFormMetadataXmlPath = join(
  import.meta.dirname,
  "../forms/clientApplicationForm/__fixtures__/minimalMetadata.xml"
)
const withDynamicListXmlPath = join(
  import.meta.dirname,
  "../forms/clientApplicationForm/__fixtures__/withDynamicList.xml"
)
const tempDirs: string[] = []
const stateStores: Array<ReturnType<typeof createBinaryProjectStateStore>["store"]> = []
let sharedStateFixture: ReturnType<typeof createBinaryProjectStateStore> | undefined

beforeAll(() => {
  sharedStateFixture = createBinaryProjectStateStore({
    projectDir: "/project",
  })
  stateStores.push(sharedStateFixture.store)
})

beforeEach(async () => {
  resetImportWorkerStateForTests()
  setImportWorkerSchemaCacheForTests({
    form: () => validSchema,
    properties: () => validSchema,
    compileAll: () => ({ formMs: 0, propertiesMs: 0, totalMs: 0 }),
  })
  await runImportWorkerCommand({
    kind: "initialize",
    operationId: "test-operation",
    workerIndex: 2,
    context: mockXmlImportContext(),
    outputDir: "/tmp/nkdk-import-worker-2",
  })
})

afterAll(() => {
  setImportWorkerSchemaCacheForTests(undefined)
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
  it("сохраняет сериализованный текст вместе с байтами без обратного декодирования", () => {
    const serialized = serializeImportYaml({
      output: { sourceKind: "worker", sourcePath: "/tmp/test.yaml", targetProjectPath: "test.yaml" },
      yaml: { Имя: "Тест" },
    })

    expect(serialized.text).toBe("Имя: Тест")
    expect(new TextDecoder().decode(serialized.bytes)).toBe(serialized.text)
  })

  it("writes ready YAML and returns the complete local validation contribution", async () => {
    const outputDir = createTempDir("first-pass-ready")
    await initializeWorker(outputDir)
    const assignment = catalogAssignment({
      itemName: "СправочникПолный",
      targetProjectPath: "Справочник/СправочникПолный/Свойства.yaml",
      logicalAddress: "Справочник.СправочникПолный",
      xmlFiles: [{ role: "metadata", sourcePath: catalogFullXmlPath }],
    })

    const result = expectFirstPass(await runImportWorkerCommand({ kind: "firstPass", assignments: [assignment] }))

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
    expect(result.stateFragment).toBeDefined()
    const state = openProjectStateFragment(result.stateFragment!)
    const imported = Array.from({ length: state.fileCount }, (_, fileId) => state.fileRecord(fileId))
      .find((file) => state.stringValue(file.projectPathId).endsWith(assignment.targetProjectPath))
    expect(imported?.hash).not.toBe(0n)
    expect(Object.keys(result).sort()).toEqual([
      "configurationFragments",
      "diagnostics",
      "files",
      "kind",
      "stateFragment",
    ])
    expect(workerStateForTests()).toMatchObject({
      operationId: "second-pass-test",
      workerIndex: 0,
      preparedYamlIds: [],
    })
    expectWrittenImportFile(result, outputDir, assignment)
    expect(workerStateForTests()).not.toHaveProperty("preparedModels")
    expect(workerStateForTests()).not.toHaveProperty("preparedXml")
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
    expect(workerStateForTests().preparedYamlIds).toEqual([])
    expect(result.files).toContainEqual(
      expect.objectContaining({ sourceKind: "worker", targetProjectPath: valid.targetProjectPath })
    )
    expect(result.configurationFragments).toHaveLength(1)
  })

  it("links a model-building error to the assignment metadata XML", async () => {
    const metadataPath = join(syncXmlDir, "Catalogs/Контрагенты.xml")
    const assignment = catalogAssignment({
      id: "unknown-model",
      itemType: "UnknownImportModel",
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
    expect(lines.some((line) => line.includes('substep="Сериализация YAML"'))).toBe(true)
    expect(lines.some((line) => line.includes('substep="Запись основного YAML-файла"'))).toBe(true)
    expect(lines).toContainEqual(
      expect.stringMatching(/substep="Досрочно записанные YAML".*items=1.*bytes=[1-9][0-9]*/)
    )
    const readLines = lines.filter((line) => line.includes('substep="Чтение XML"'))
    expect(readLines).toHaveLength(1)
    expect(readLines[0]).toContain("items=1")
    const serializationLines = lines.filter((line) => line.includes('substep="Сериализация YAML"'))
    expect(serializationLines).toHaveLength(1)
    expect(serializationLines.every((line) => line.includes("items=1"))).toBe(true)
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

  it.each(["Объект.Товары.НомерСтроки", "Объект.Товары.CustomField"])(
    "writes a form without an English standard member during the first pass: %s",
    async (dataPath) => {
      const outputDir = createTempDir("first-pass-form")
      const assignments = createCatalogAndFormAssignments(dataPath)
      await initializeWorker(outputDir)

      const first = expectFirstPass(
        await runImportWorkerCommand({ kind: "firstPass", assignments: [assignments.catalog, assignments.form] })
      )

      expect(first.diagnostics).toEqual([])
      expect(first.files.map(({ targetProjectPath }) => targetProjectPath)).toEqual(
        expect.arrayContaining([assignments.catalog.targetProjectPath, assignments.form.targetProjectPath])
      )
      expect(workerStateForTests().preparedYamlIds).toEqual([])
    }
  )

  it("writes generated files during the first pass even when the main form YAML is deferred", async () => {
    const outputDir = createTempDir("first-pass-generated")
    const assignments = createCatalogAndFormAssignments("Неизвестный.LineNumber", "Товары", false, true)
    await initializeWorker(outputDir)

    const first = expectFirstPass(
      await runImportWorkerCommand({ kind: "firstPass", assignments: [assignments.catalog, assignments.form] })
    )

    const generated = first.files.find(({ targetProjectPath }) => targetProjectPath.endsWith(".query"))
    expect(generated).toBeDefined()
    expect(existsSync(generated!.sourcePath)).toBe(true)
    expect(first.files.map(({ targetProjectPath }) => targetProjectPath)).not.toContain(
      assignments.form.targetProjectPath
    )
    expect(workerStateForTests().preparedYamlIds).toEqual([assignments.form.id])
  })

  it("returns XML external file descriptors during the first pass", async () => {
    const sourcePath = join(createTempDir("external-source"), "Help.xml")
    writeFileSync(sourcePath, "<Help/>", "utf-8")
    const assignment = catalogAssignment({
      externalFiles: [{ sourcePath, targetProjectPath: "Справочник/Контрагенты/Справка.xml" }],
    })

    const first = expectFirstPass(await runImportWorkerCommand({ kind: "firstPass", assignments: [assignment] }))

    expect(first.files).toContainEqual({
      sourceKind: "xml",
      sourcePath,
      targetProjectPath: "Справочник/Контрагенты/Справка.xml",
    })
  })
})

describe("XML import worker second pass", () => {
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

    await runImportWorkerCommand({ kind: "secondPassBatch", assignmentIds: [assignments.form.id] })
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
    const finished = await runImportWorkerCommand({ kind: "finishSecondPass" })

    expect(finished).toBeUndefined()
  })

  it.each([
    ["Catalog", catalogAssignment()],
    [
      "DocumentNumerator",
      catalogAssignment({
        id: "document-numerator",
        itemType: "MetadataDocumentNumerator",
        itemName: "НумераторПоУмолчанию",
        logicalAddress: "Нумератор.НумераторПоУмолчанию",
        targetProjectPath: "Нумератор/НумераторПоУмолчанию/Свойства.yaml",
        xmlFiles: [{ role: "metadata", sourcePath: minimalNumeratorXmlPath }],
      }),
    ],
  ])("writes %s to its fixed Свойства.yaml target path", async (_itemType, assignment) => {
    const outputDir = createTempDir("worker-target")
    await initializeWorker(outputDir)
    const first = expectFirstPass(await runImportWorkerCommand({ kind: "firstPass", assignments: [assignment] }))

    expectWrittenImportFile(first, outputDir, assignment)
    expect(existsSync(join(outputDir, assignment.targetProjectPath.replace(/\/Свойства\.yaml$/, ".yaml")))).toBe(false)
  })

  it("writes a cross-object DataPath through the shared snapshot without reading a YAML project", async () => {
    const tempDir = createTempDir("worker")
    const projectDir = createTempDir("empty-project")
    const { assignments, first, second } = await runCatalogAndFormSecondPass(
      tempDir,
      "Объект.Товары.LineNumber",
      undefined,
      ({ assignments: firstPassAssignments }) => {
        expect(workerStateForTests().preparedYamlIds).toEqual([firstPassAssignments.form.id])
      },
    )
    expect(first.diagnostics).toEqual([])
    expect(first.files.map(({ targetProjectPath }) => targetProjectPath)).toContain(
      assignments.catalog.targetProjectPath
    )
    expect(first.files.map(({ targetProjectPath }) => targetProjectPath)).not.toContain(
      assignments.form.targetProjectPath
    )
    expect(second).toMatchObject({ kind: "secondPassResult", diagnostics: [], warnings: [] })
    if (second?.kind !== "secondPassResult") throw new Error("Ожидался secondPassResult")
    const formFile = second.files.find((file) => file.targetProjectPath === assignments.form.targetProjectPath)
    expect(formFile).toMatchObject({ sourceKind: "worker" })
    if (formFile === undefined) throw new Error("Ожидался файл формы")
    expect(readFileSync(formFile.sourcePath, "utf-8")).toContain("ПутьКДанным: Объект.Товары.НомерСтроки")
    expect(existsSync(join(projectDir, "Справочник", "Товары", "Свойства.yaml"))).toBe(false)
    expect(workerStateForTests().preparedYamlIds).toEqual([])
  })

  it("writes a user DataPath before building the layered owner snapshot", async () => {
    const tempDir = createTempDir("worker-layered")
    const { assignments, first, second } = await runCatalogAndFormSecondPass(
      tempDir,
      "Объект.БазовыйРеквизит",
      "Базовый",
    )

    expect(second).toMatchObject({ kind: "secondPassResult", diagnostics: [], warnings: [] })
    if (second?.kind !== "secondPassResult") throw new Error("Ожидался secondPassResult")
    const formFile = first.files.find((file) => file.targetProjectPath === assignments.form.targetProjectPath)
    if (formFile === undefined) throw new Error("Ожидался файл формы")
    expect(readFileSync(formFile.sourcePath, "utf-8")).toContain("ПутьКДанным: Объект.БазовыйРеквизит")
    expect(second.files).toEqual([])
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

  it("continues first pass after an early YAML write error", async () => {
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

    expect(first).toMatchObject({
      kind: "firstPassResult",
      diagnostics: [
        {
          severity: "error",
          code: "xml_import_yaml_failed",
          targetProjectPath: blocked.targetProjectPath,
        },
      ],
    })
    expect(first.files).toContainEqual(
      expect.objectContaining({ sourceKind: "worker", targetProjectPath: valid.targetProjectPath })
    )
    expect(workerStateForTests().preparedYamlIds).toEqual([])
  })
})

function catalogAssignment(overrides: Partial<ImportAssignment> = {}): ImportAssignment {
  return {
    id: "catalog",
    role: "properties",
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

function expectWrittenImportFile(
  result: ImportFirstPassResult,
  outputDir: string,
  assignment: ImportAssignment,
): void {
  expect(result.files).toContainEqual({
    sourceKind: "worker",
    sourcePath: join(outputDir, assignment.targetProjectPath),
    targetProjectPath: assignment.targetProjectPath,
  })
  expect(existsSync(join(outputDir, assignment.targetProjectPath))).toBe(true)
}

async function initializeWorker(outputDir: string): Promise<void> {
  await runImportWorkerCommand({
    kind: "initialize",
    operationId: "second-pass-test",
    workerIndex: 0,
    context: mockXmlImportContext(),
    outputDir,
  })
}

function createReadToken(first: ImportFirstPassResult): ProjectStateReadToken {
  const fixture = sharedStateFixture
  if (fixture === undefined) throw new Error("ProjectState test fixture не инициализирована")
  fixture.store.beginUpdate()
  if (first.stateFragment !== undefined) fixture.store.appendFragment(first.stateFragment)
  fixture.store.commitUpdate()
  return fixture.store.createReadToken()
}

async function runCatalogAndFormSecondPass(
  outputDir: string,
  dataPath: string,
  objectTypeName?: string,
  onFirstPass?: (result: {
    readonly assignments: ReturnType<typeof createCatalogAndFormAssignments>
    readonly first: ImportFirstPassResult
  }) => void,
) {
  const assignments = createCatalogAndFormAssignments(dataPath, objectTypeName)
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
  }
  return { assignments, first, second }
}

function createCatalogAndFormAssignments(
  dataPath: string,
  objectTypeName = "Товары",
  includeUsualGroup = false,
  includeDynamicList = false
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
  const labelField = `<LabelField name="Путь" id="2">
\t\t\t<DataPath>${dataPath}</DataPath>
\t\t\t<ContextMenu name="ПутьКонтекстноеМеню" id="3"/>
\t\t\t<ExtendedTooltip name="ПутьРасширеннаяПодсказка" id="4"/>
\t\t</LabelField>`
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
