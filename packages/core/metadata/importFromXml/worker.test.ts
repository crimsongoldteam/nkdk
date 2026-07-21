import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { transferableSymbol, valueSymbol } from "piscina"
import { mockContextFromXML } from "../../tests/mockContext"
import { decodeConfigurationIndexFragments } from "../configurationIndex/fragment"
import type { ImportFirstPassResult } from "./types"
import { createImportSharedMetadata } from "./metadataSnapshot"
import {
  createFirstPassTransferable,
  resetImportWorkerStateForTests,
  runImportWorkerCommand,
  workerStateForTests,
} from "./worker"
import type { ImportAssignment } from "./types"

const syncXmlDir = join(import.meta.dirname, "../appliedObjects/configuration/__fixtures__/syncConfiguration/xml")
const catalogFullXmlPath = join(import.meta.dirname, "../appliedObjects/metadataCatalog/__fixtures__/full.xml")
const minimalFormXmlPath = join(import.meta.dirname, "../forms/clientApplicationForm/__fixtures__/minimal.xml")
const minimalFormMetadataXmlPath = join(
  import.meta.dirname,
  "../forms/clientApplicationForm/__fixtures__/minimalMetadata.xml"
)
const tempDirs: string[] = []

beforeEach(async () => {
  resetImportWorkerStateForTests()
  await runImportWorkerCommand({
    kind: "initialize",
    operationId: "test-operation",
    workerIndex: 2,
    context: mockContextFromXML(),
    outputDir: "/tmp/nkdk-import-worker-2",
  })
})

afterEach(() => {
  resetImportWorkerStateForTests()
  for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

describe("XML import worker first pass", () => {
  it("retains YAML locally and returns only owner facts and an index fragment buffer", async () => {
    const assignment = catalogAssignment()

    const result = expectFirstPass(await runImportWorkerCommand({ kind: "firstPass", assignments: [assignment] }))

    expect(result.diagnostics).toEqual([])
    expect(result.ownerFacts).toEqual([
      expect.objectContaining({
        ref: { kind: "Справочник", name: "Контрагенты" },
        filePath: assignment.targetProjectPath,
      }),
    ])
    expect(decodeConfigurationIndexFragments(result.fragmentBuffer)).toEqual([
      expect.objectContaining({ targetProjectPath: assignment.targetProjectPath }),
    ])
    expect(Object.keys(result).sort()).toEqual(["diagnostics", "fragmentBuffer", "kind", "ownerFacts"])
    expect(workerStateForTests()).toMatchObject({
      operationId: "test-operation",
      workerIndex: 2,
      preparedYamlIds: [assignment.id],
    })
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
    expect(workerStateForTests().preparedYamlIds).toEqual([valid.id])
    expect(decodeConfigurationIndexFragments(result.fragmentBuffer)).toHaveLength(1)
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

  it("declares exactly the fragment buffer as the Piscina transfer list", () => {
    const fragmentBuffer = new ArrayBuffer(16)
    const result: ImportFirstPassResult = {
      kind: "firstPassResult",
      ownerFacts: [],
      diagnostics: [],
      fragmentBuffer,
    }

    const transferable = createFirstPassTransferable(result)

    expect(transferable[transferableSymbol]).toEqual([fragmentBuffer])
    expect(transferable[valueSymbol]).toBe(result)
  })

  it("emits import profile records for worker first pass steps", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined)
    const previous = process.env["NKDK_PROFILE"]
    let lines: string[] = []
    process.env["NKDK_PROFILE"] = "1"
    try {
      await initializeWorker(createTempDir("profile"))
      const first = expectFirstPass(
        await runImportWorkerCommand({
          kind: "firstPass",
          assignments: [
            catalogAssignment({ id: "catalog-1" }),
            catalogAssignment({
              id: "catalog-2",
              targetProjectPath: "Справочник/КонтрагентыКопия/Свойства.yaml",
              itemName: "КонтрагентыКопия",
              logicalAddress: "Справочник.КонтрагентыКопия",
            }),
          ],
        })
      )
      await runImportWorkerCommand({
        kind: "secondPass",
        sharedMetadata: createImportSharedMetadata(first.ownerFacts),
      })
      lines = error.mock.calls.map(([line]) => String(line))
    } finally {
      if (previous === undefined) delete process.env["NKDK_PROFILE"]
      else process.env["NKDK_PROFILE"] = previous
      error.mockRestore()
    }

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
    expect(lines.some((line) => line.includes("[nkdk-profile-step]") && line.includes('substep="Парсинг XML"'))).toBe(true)
    expect(lines.some((line) => line.includes('substep="Преобразование XML в YAML"'))).toBe(true)
    expect(lines.some((line) => line.includes('substep="Сбор локальных индексов"'))).toBe(true)
    expect(lines.some((line) => line.includes('substep="Извлечение данных для индекса конфигурации"'))).toBe(true)
    expect(lines.some((line) => line.includes('substep="Уточнение отложенных значений YAML"'))).toBe(true)
    expect(lines.some((line) => line.includes('substep="Сериализация YAML"'))).toBe(true)
    expect(lines.some((line) => line.includes('substep="Запись основного YAML-файла"'))).toBe(true)
    const readLines = lines.filter((line) => line.includes('substep="Чтение XML"'))
    expect(readLines).toHaveLength(1)
    expect(readLines[0]).toContain("items=2")
    const serializationLines = lines.filter((line) => line.includes('substep="Сериализация YAML"'))
    expect(serializationLines).toHaveLength(1)
    expect(serializationLines[0]).toContain("items=2")
    expect(lines.some((line) => line.includes('substep="Построение модели"'))).toBe(false)
    expect(lines.some((line) => line.includes('substep="Экспорт модели в YAML-объект"'))).toBe(false)
  })

  it("releases retained YAML on dispose", async () => {
    await runImportWorkerCommand({ kind: "firstPass", assignments: [catalogAssignment()] })

    await runImportWorkerCommand({ kind: "dispose" })

    expect(workerStateForTests().preparedYamlIds).toEqual([])
    expect(workerStateForTests().initialized).toBe(false)
  })
})

describe("XML import worker second pass", () => {
  it("writes a cross-object DataPath through the shared snapshot without reading a YAML project", async () => {
    const tempDir = createTempDir("worker")
    const projectDir = createTempDir("empty-project")
    const assignments = createCatalogAndFormAssignments("Объект.Товары.LineNumber")
    await initializeWorker(tempDir)
    const first = expectFirstPass(
      await runImportWorkerCommand({ kind: "firstPass", assignments: [assignments.catalog, assignments.form] })
    )
    expect(first.diagnostics).toEqual([])

    const second = await runImportWorkerCommand({
      kind: "secondPass",
      sharedMetadata: createImportSharedMetadata(first.ownerFacts),
    })

    expect(second).toMatchObject({ kind: "secondPassResult", diagnostics: [], warnings: [] })
    if (second?.kind !== "secondPassResult") throw new Error("Ожидался secondPassResult")
    const formFile = second.files.find((file) => file.targetProjectPath === assignments.form.targetProjectPath)
    expect(formFile).toMatchObject({ sourceKind: "worker" })
    if (formFile === undefined) throw new Error("Ожидался файл формы")
    expect(readFileSync(formFile.sourcePath, "utf-8")).toContain("ПутьКДанным: Объект.Товары.НомерСтроки")
    expect(existsSync(join(projectDir, "Справочник", "Товары", "Свойства.yaml"))).toBe(false)
    expect(workerStateForTests().preparedYamlIds).toEqual([])
  })

  it("preserves an unresolved DataPath, returns one warning and releases the YAML", async () => {
    const tempDir = createTempDir("worker")
    const assignments = createCatalogAndFormAssignments("Объект.НеизвестныйПереход.LineNumber")
    await initializeWorker(tempDir)
    const first = expectFirstPass(
      await runImportWorkerCommand({ kind: "firstPass", assignments: [assignments.catalog, assignments.form] })
    )

    const second = await runImportWorkerCommand({
      kind: "secondPass",
      sharedMetadata: createImportSharedMetadata(first.ownerFacts),
    })

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

  it("continues after a YAML write error and releases every prepared YAML", async () => {
    const tempDir = createTempDir("worker")
    const assignments = createCatalogAndFormAssignments("Объект.Товары.LineNumber")
    await initializeWorker(tempDir)
    const first = expectFirstPass(
      await runImportWorkerCommand({ kind: "firstPass", assignments: [assignments.catalog, assignments.form] })
    )
    const blockedCatalogPath = join(tempDir, assignments.catalog.targetProjectPath)
    mkdirSync(blockedCatalogPath, { recursive: true })

    const second = await runImportWorkerCommand({
      kind: "secondPass",
      sharedMetadata: createImportSharedMetadata(first.ownerFacts),
    })

    expect(second).toMatchObject({
      kind: "secondPassResult",
      diagnostics: [
        {
          severity: "error",
          code: "xml_import_yaml_failed",
          targetProjectPath: assignments.catalog.targetProjectPath,
        },
      ],
    })
    if (second?.kind !== "secondPassResult") throw new Error("Ожидался secondPassResult")
    expect(second.files).toContainEqual(
      expect.objectContaining({ sourceKind: "worker", targetProjectPath: assignments.form.targetProjectPath })
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

async function initializeWorker(outputDir: string): Promise<void> {
  await runImportWorkerCommand({
    kind: "initialize",
    operationId: "second-pass-test",
    workerIndex: 0,
    context: mockContextFromXML(),
    outputDir,
  })
}

function createCatalogAndFormAssignments(dataPath: string): { catalog: ImportAssignment; form: ImportAssignment } {
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
  writeFileSync(
    formBodyPath,
    readFileSync(minimalFormXmlPath, "utf-8")
      .replace(
        '<AutoCommandBar name="ФормаКоманднаяПанель" id="-1"/>',
        `<AutoCommandBar name="ФормаКоманднаяПанель" id="-1"/>
\t<ChildItems>
\t\t<LabelField name="Путь" id="2">
\t\t\t<DataPath>${dataPath}</DataPath>
\t\t\t<ContextMenu name="ПутьКонтекстноеМеню" id="3"/>
\t\t\t<ExtendedTooltip name="ПутьРасширеннаяПодсказка" id="4"/>
\t\t</LabelField>
\t</ChildItems>`
      )
      .replace(
        "<Attributes/>",
        `<Attributes>
\t\t<Attribute name="Объект" id="1">
\t\t\t<Type><v8:Type>cfg:CatalogObject.Товары</v8:Type></Type>
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
