import fs from "node:fs"
import os from "node:os"
import { join } from "node:path"
import {
  createConfigurationIndexCollector,
  createLocalConfigurationIndexReader,
  snapshotXmlAnomalyAnnotations,
} from "@nkdk/runtime"
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import { mockXmlImportContext } from "../../tests/mockContext"
import "../../tests/metadataExecutionContext"
import { createValidationProjectComponent } from "../validation/projectComponents"
import { prepareFullXmlSyncAssignment } from "../fullSyncToXml/prepareAssignment"
import { prepareImportYaml } from "./prepareYaml"
import type { ImportAssignment } from "./types"
import {
  controlExportCountForTests,
  executeImportControlExport,
  resetControlExportCountForTests,
} from "./controlExport"

const syncXmlDir = join(import.meta.dirname, "../appliedObjects/configuration/__fixtures__/syncConfiguration/xml")
let topology: ReturnType<typeof createValidationProjectComponent>["topology"]
let catalogNode: NonNullable<typeof topology>["assignments"][number]
let catalogFormNode: NonNullable<typeof topology>["assignments"][number]

describe("executeImportControlExport", () => {
  const tempDirs: string[] = []

  beforeAll(() => {
    topology = createValidationProjectComponent("/project", { kind: "configuration" }).topology
    const node = topology.assignments.find(
      ({ projectPattern }) => projectPattern === "Справочник/{ownerName}/Свойства.yaml",
    )
    if (node === undefined) throw new Error("Не найден topology-узел справочника")
    catalogNode = node
    const formNode = topology.assignments.find(
      ({ projectPattern }) => projectPattern === "Справочник/{ownerName}/Формы/{itemName}/Форма.yaml",
    )
    if (formNode === undefined) throw new Error("Не найден topology-узел формы справочника")
    catalogFormNode = formNode
  })
  beforeEach(resetControlExportCountForTests)
  afterEach(() => {
    for (const dir of tempDirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true })
  })

  it("выполняет один обычный экспорт assignment независимо от числа PropertyRule", async () => {
    const ordinaryExporter = vi.fn(prepareFullXmlSyncAssignment)
    const { prepared, initialAnnotations, result } = await runCatalogControlExport(undefined, ordinaryExporter)

    expect(Object.keys(prepared.rule.properties).length).toBeGreaterThan(10)
    expect(newAnnotationKeys(initialAnnotations, result.annotations)).toEqual(["Properties"])
    expect(ordinaryExporter).toHaveBeenCalledTimes(1)
    expect(ordinaryExporter).toHaveBeenCalledWith(expect.objectContaining({
      xmlAnomalyRawFallback: false,
    }))
    expect(controlExportCountForTests()).toBe(1)
  })

  it("считает фактический failed exporter invocation, но не ранний отказ projection", async () => {
    await expect(runCatalogControlExport(undefined, () => {
      throw new Error("ordinary exporter failed")
    })).rejects.toThrow("ordinary exporter failed")
    expect(controlExportCountForTests()).toBe(1)

    resetControlExportCountForTests()
    const assignment = { ...catalogAssignment(), targetProjectPath: "Неизвестно/Свойства.yaml" }
    await expect(executeCatalogControlExport({
      assignment,
      data: {},
      annotations: { version: 1, entries: [] },
      audit: { sources: [], boundaries: [] },
      index: createLocalConfigurationIndexReader(new Map()),
      readSource: async () => "",
    })).rejects.toThrow("content topology")
    expect(controlExportCountForTests()).toBe(0)
  })

  it("не запускает ordinary exporter для корневого raw", async () => {
    const ordinaryExporter = vi.fn(() => { throw new Error("root raw не должен экспортироваться") })
    const annotations = {
      version: 1 as const,
      root: { kind: "raw" as const, occurrence: 1, target: "root" as const },
      entries: [],
    }

    const result = await executeCatalogControlExport({
      assignment: catalogAssignment(),
      data: { Future: "value" },
      annotations,
      audit: { sources: [], boundaries: [] },
      index: createLocalConfigurationIndexReader(new Map()),
      readSource: async () => { throw new Error("root raw не должен перечитывать source") },
      ordinaryExporter,
    })

    expect(result).toEqual({
      data: { Future: "value" },
      annotations,
      rereadSourcePaths: [],
    })
    expect(ordinaryExporter).not.toHaveBeenCalled()
    expect(controlExportCountForTests()).toBe(0)
  })

  it("удаляет предварительный raw, если обычный экспорт восстановил XML без него", async () => {
    const { prepared, index } = await prepareCatalogControlInput()
    const data = {
      ...(prepared.yaml as Record<string, unknown>),
      ТипКода: "Число",
    }
    const initial = snapshotXmlAnomalyAnnotations(prepared.yaml, prepared.annotations)
    const annotations = {
      ...initial,
      entries: [
        ...initial.entries,
        {
          parentPath: [],
          key: "ТипКода",
          annotation: { kind: "raw" as const, occurrence: 1, target: "value" as const },
        },
      ],
    }

    const result = await executePreparedCatalogControlExport({
      prepared,
      index,
      data,
      annotations,
      readSource: async (path) => fs.promises.readFile(path, "utf8"),
    })

    expect((result.data as Record<string, unknown>).ТипКода).toBeUndefined()
    expect(result.annotations.entries).not.toEqual(expect.arrayContaining(annotations.entries))
    expect(newAnnotationKeys(annotations, result.annotations)).toEqual(["Properties"])
    expect(result.rereadSourcePaths).toEqual([prepared.assignment.xmlFiles[0]!.sourcePath])
  })

  it("полностью заменяет чтение дочерних файлов переданной composition", async () => {
    const { prepared, index } = await prepareCatalogControlInput()
    const cwd = process.cwd()
    const conflictCwd = fs.mkdtempSync(join(os.tmpdir(), "nkdk-control-composition-"))
    tempDirs.push(conflictCwd)
    fs.mkdirSync(join(conflictCwd, "Справочник/Контрагенты/Формы/ЛожнаяФорма"), { recursive: true })
    process.chdir(conflictCwd)
    const exists = vi.spyOn(fs, "existsSync").mockImplementation(() => {
      throw new Error("proof export не должен читать cwd")
    })
    const readdir = vi.spyOn(fs, "readdirSync").mockImplementation(() => {
      throw new Error("proof export не должен перечислять cwd")
    })

    try {
      const result = await executePreparedCatalogControlExport({
        prepared,
        index,
        readSource: async (path) => fs.promises.readFile(path, "utf8"),
      })

      expect(result.rereadSourcePaths).toEqual([prepared.assignment.xmlFiles[0]!.sourcePath])
    } finally {
      exists.mockRestore()
      readdir.mockRestore()
      process.chdir(cwd)
    }
  })

  it("связывает property source только с точным output, а не со всеми необязательными", async () => {
    const assignment = catalogAssignment()
    const helpSourcePath = "/source/Catalogs/Контрагенты/Ext/Help.xml"
    const propertyTargets: string[] = []
    const ordinaryExporter = vi.fn((params: Parameters<typeof prepareFullXmlSyncAssignment>[0]) => {
      propertyTargets.push(...params.assignment.potentialOutputs
        .filter(({ role }) => role === "property")
        .map(({ targetXmlPath }) => targetXmlPath))
      throw new Error("projection captured")
    })

    await expect(executeCatalogControlExport({
      assignment: {
        ...assignment,
        xmlFiles: [
          ...assignment.xmlFiles,
          { role: "property", sourcePath: helpSourcePath },
        ],
      },
      data: {},
      annotations: { version: 1, entries: [] },
      audit: { sources: [], boundaries: [] },
      index: createLocalConfigurationIndexReader(new Map()),
      readSource: async () => { throw new Error("projection не должен читать файлы") },
      ordinaryExporter,
    })).rejects.toThrow("projection captured")

    expect(propertyTargets).toEqual([
      expect.stringMatching(/Catalogs\/Контрагенты\/Ext\/Help\.xml$/u),
    ])
  })

  it("локализует неканоническое число 01 и перечитывает только его source", async () => {
    const inputDir = fs.mkdtempSync(join(os.tmpdir(), "nkdk-control-export-"))
    tempDirs.push(inputDir)
    const sourcePath = join(inputDir, "Контрагенты.xml")
    fs.writeFileSync(
      sourcePath,
      fs.readFileSync(join(syncXmlDir, "Catalogs/Контрагенты.xml"), "utf8")
        .replace("<CodeLength>9</CodeLength>", "<CodeLength>01</CodeLength>"),
    )
    const { initialAnnotations, result } = await runCatalogControlExport(sourcePath)

    expect((result.data as Record<string, unknown>).ДлинаКода).toBe(1)
    expect(result.annotations.entries).toEqual(expect.arrayContaining([
      expect.objectContaining({
        parentPath: [],
        key: "ДлинаКода",
        annotation: {
          kind: "raw",
          occurrence: 1,
          target: "value",
          xml: { "#text": "01" },
          hasSemanticValue: true,
        },
      }),
    ]))
    expect(result.rereadSourcePaths).toEqual([sourcePath])
    expect(newAnnotationKeys(initialAnnotations, result.annotations)).toEqual([
      "ДлинаКода",
      "Properties",
    ])
    expect(controlExportCountForTests()).toBe(1)
  })

  it("локализует неизвестный xsi:type на значении свойства", async () => {
    const inputDir = fs.mkdtempSync(join(os.tmpdir(), "nkdk-control-export-xsi-"))
    tempDirs.push(inputDir)
    const sourcePath = join(inputDir, "Контрагенты.xml")
    fs.writeFileSync(
      sourcePath,
      fs.readFileSync(join(syncXmlDir, "Catalogs/Контрагенты.xml"), "utf8")
        .replace("<CodeLength>9</CodeLength>", '<CodeLength xsi:type="xs:future">9</CodeLength>'),
    )
    const { initialAnnotations, result } = await runCatalogControlExport(sourcePath)

    expect((result.data as Record<string, unknown>).ДлинаКода).toBeUndefined()
    expect(result.annotations.entries).toEqual(expect.arrayContaining([
      expect.objectContaining({
        parentPath: [],
        key: "ДлинаКода",
        annotation: expect.objectContaining({
          kind: "raw",
          xml: { "_xsi:type": "xs:future", "#text": "9" },
          hasSemanticValue: false,
        }),
      }),
    ]))
    expect(newAnnotationKeys(initialAnnotations, result.annotations)).toEqual([
      "ДлинаКода",
      "Properties",
    ])
    expect(controlExportCountForTests()).toBe(1)
  })

  it("не принимает неизвестный XML-узел Item за служебный элемент коллекции", async () => {
    const inputDir = fs.mkdtempSync(join(os.tmpdir(), "nkdk-control-export-item-"))
    tempDirs.push(inputDir)
    const sourcePath = join(inputDir, "Контрагенты.xml")
    fs.writeFileSync(
      sourcePath,
      fs.readFileSync(join(syncXmlDir, "Catalogs/Контрагенты.xml"), "utf8")
        .replace("<CodeLength>9</CodeLength>", "<CodeLength>9</CodeLength><Item>future</Item>"),
    )

    const { prepared, index } = await prepareCatalogControlInput(sourcePath)
    const result = await executePreparedCatalogControlExport({
      prepared,
      index,
      readSource: async (path) => fs.promises.readFile(path, "utf8"),
      loadDetailedImport: async () => ({
        data: prepared.yaml,
        annotations: snapshotXmlAnomalyAnnotations(prepared.yaml, prepared.annotations),
        audit: prepared.proofAudit,
      }),
    })

    expect(Object.prototype.hasOwnProperty.call(result.data, "Properties\\Item")).toBe(true)
    expect(result.annotations.entries).toEqual(expect.arrayContaining([
      expect.objectContaining({
        parentPath: [],
        key: "Properties\\Item",
        annotation: expect.objectContaining({ kind: "raw" }),
      }),
    ]))
  })

  it("не сохраняет raw-поправку, которая не меняет обычный xr:Item", async () => {
    const inputDir = fs.mkdtempSync(join(os.tmpdir(), "nkdk-control-export-known-item-"))
    tempDirs.push(inputDir)
    const sourcePath = join(inputDir, "Контрагенты.xml")
    fs.writeFileSync(
      sourcePath,
      fs.readFileSync(join(syncXmlDir, "Catalogs/Контрагенты.xml"), "utf8")
        .replace(
          "<Owners/>",
          '<Owners><xr:Item xsi:type="xr:MDObjectRef">Catalog.Контрагенты</xr:Item></Owners>',
        ),
    )
    const { prepared, index } = await prepareCatalogControlInput(sourcePath)
    const detailedData = {
      ...(prepared.yaml as Record<string, unknown>),
      "Properties\\Owners\\xr:Item": undefined,
    }
    const detailedAnnotations = snapshotXmlAnomalyAnnotations(prepared.yaml, prepared.annotations)

    const result = await executePreparedCatalogControlExport({
      prepared,
      index,
      readSource: async (path) => fs.promises.readFile(path, "utf8"),
      loadDetailedImport: async () => ({
        data: detailedData,
        annotations: {
          ...detailedAnnotations,
          entries: [
            ...detailedAnnotations.entries,
            {
              parentPath: [],
              key: "Properties\\Owners\\xr:Item",
              annotation: {
                kind: "raw" as const,
                occurrence: 1,
                target: "value" as const,
                xml: { "_xsi:type": "xr:MDObjectRef" },
                hasSemanticValue: false,
              },
            },
          ],
        },
        audit: prepared.proofAudit,
      }),
    })

    expect(result.annotations.entries).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ key: "Properties\\Owners\\xr:Item" }),
    ]))
  })

  it("не принимает внутреннее имя формы, которое обычная синхронизация изменит", async () => {
    const inputDir = fs.mkdtempSync(join(os.tmpdir(), "nkdk-control-export-form-"))
    tempDirs.push(inputDir)
    const fixtureDir = join(syncXmlDir, "Catalogs/Контрагенты/Forms")
    const metadataPath = join(inputDir, "ФормаЭлемента.xml")
    const bodyPath = join(inputDir, "Form.xml")
    fs.copyFileSync(join(fixtureDir, "ФормаЭлемента.xml"), metadataPath)
    fs.writeFileSync(
      bodyPath,
      fs.readFileSync(join(fixtureDir, "ФормаЭлемента/Ext/Form.xml"), "utf8")
        .replace("ПолеВвода1РасширеннаяПодсказка", "ПолеВвода1ExtendedTooltip"),
    )
    const assignment = catalogFormAssignment(metadataPath, bodyPath)
    const { prepared, index } = await prepareControlInput(assignment)
    const result = await executeImportControlExport({
      assignment,
      data: prepared.yaml,
      annotations: snapshotXmlAnomalyAnnotations(prepared.yaml, prepared.annotations),
      audit: prepared.proofAudit,
      rule: prepared.rule,
      topology,
      context: mockXmlImportContext(),
      index,
      composition: { children: () => [] },
      readSource: async (path) => fs.promises.readFile(path, "utf8"),
    })

    expect(result.rereadSourcePaths).toContain(bodyPath)
    expect(JSON.stringify(result.annotations.entries)).toContain("ПолеВвода1ExtendedTooltip")
  })
})

async function runCatalogControlExport(
  sourcePath?: string,
  ordinaryExporter?: typeof prepareFullXmlSyncAssignment,
) {
  const { prepared, index } = await prepareCatalogControlInput(sourcePath)
  const initialAnnotations = snapshotXmlAnomalyAnnotations(prepared.yaml, prepared.annotations)
  const result = await executePreparedCatalogControlExport({
    prepared,
    index,
    annotations: initialAnnotations,
    readSource: async (path) => fs.promises.readFile(path, "utf8"),
    ...(ordinaryExporter === undefined ? {} : { ordinaryExporter }),
  })
  return { prepared, initialAnnotations, result }
}

async function prepareCatalogControlInput(sourcePath?: string) {
  return prepareControlInput(catalogAssignment(sourcePath))
}

async function prepareControlInput(assignment: ImportAssignment) {
  const collector = createConfigurationIndexCollector()
  const prepared = await prepareImportYaml({
    assignment,
    context: mockXmlImportContext(),
    collector,
    topology,
  })
  const fragment = collector.fragment(prepared.targetProjectPath)
  const index = createLocalConfigurationIndexReader(new Map([
    [fragment.targetProjectPath, { entities: fragment.entities }],
  ]))
  return { prepared, index }
}

async function executePreparedCatalogControlExport(params: {
  prepared: Awaited<ReturnType<typeof prepareImportYaml>>
  index: ReturnType<typeof createLocalConfigurationIndexReader>
  data?: unknown
  annotations?: ReturnType<typeof snapshotXmlAnomalyAnnotations>
  readSource: (sourcePath: string) => Promise<string>
  ordinaryExporter?: typeof prepareFullXmlSyncAssignment
  loadDetailedImport?: NonNullable<Parameters<typeof executeImportControlExport>[0]["loadDetailedImport"]>
}) {
  return executeCatalogControlExport({
    assignment: params.prepared.assignment,
    data: params.data ?? params.prepared.yaml,
    annotations: params.annotations
      ?? snapshotXmlAnomalyAnnotations(params.prepared.yaml, params.prepared.annotations),
    audit: params.prepared.proofAudit,
    rule: params.prepared.rule,
    index: params.index,
    readSource: params.readSource,
    ...(params.ordinaryExporter === undefined ? {} : { ordinaryExporter: params.ordinaryExporter }),
    ...(params.loadDetailedImport === undefined ? {} : { loadDetailedImport: params.loadDetailedImport }),
  })
}

function executeCatalogControlExport(
  params: Omit<Parameters<typeof executeImportControlExport>[0], "topology" | "context" | "composition">,
) {
  return executeImportControlExport({
    ...params,
    topology,
    context: mockXmlImportContext(),
    composition: catalogComposition(),
  })
}

function newAnnotationKeys(
  before: ReturnType<typeof snapshotXmlAnomalyAnnotations>,
  after: ReturnType<typeof snapshotXmlAnomalyAnnotations>,
): (string | number)[] {
  const existing = new Set(before.entries.map((entry) => JSON.stringify(entry)))
  return after.entries.filter((entry) => !existing.has(JSON.stringify(entry))).map(({ key }) => key)
}

function catalogComposition() {
  return {
    children(ownerLogicalAddress: string) {
      if (ownerLogicalAddress !== "Справочник.Контрагенты") return []
      return [{
        sourceProjectPath: "Справочник/Контрагенты/Формы/ФормаЭлемента/Форма.yaml",
        itemType: "ClientApplicationForm",
        itemName: "ФормаЭлемента",
        logicalAddress: "Справочник.Контрагенты.Форма.ФормаЭлемента",
        assignmentRole: "fileItem" as const,
        ownerLogicalAddress,
      }]
    },
  }
}

function catalogAssignment(sourcePath = join(syncXmlDir, "Catalogs/Контрагенты.xml")): ImportAssignment {
  return {
    id: "catalog",
    role: "properties",
    topologyAddress: { nodeId: catalogNode.id, values: { ownerName: "Контрагенты" } },
    targetProjectPath: "Справочник/Контрагенты/Свойства.yaml",
    itemType: "MetadataCatalog",
    itemName: "Контрагенты",
    logicalAddress: "Справочник.Контрагенты",
    owner: undefined,
    xmlFiles: [{ role: "metadata", sourcePath }],
    externalFiles: [],
  }
}

function catalogFormAssignment(metadataPath: string, bodyPath: string): ImportAssignment {
  return {
    id: "catalog-form",
    role: "fileItem",
    topologyAddress: {
      nodeId: catalogFormNode.id,
      values: { ownerName: "Контрагенты", itemName: "ФормаЭлемента" },
    },
    targetProjectPath: "Справочник/Контрагенты/Формы/ФормаЭлемента/Форма.yaml",
    itemType: "ClientApplicationForm",
    itemName: "ФормаЭлемента",
    logicalAddress: "Справочник.Контрагенты.Форма.ФормаЭлемента",
    owner: {
      itemType: "MetadataCatalog",
      name: "Контрагенты",
      logicalAddress: "Справочник.Контрагенты",
    },
    xmlFiles: [
      { role: "metadata", sourcePath: metadataPath },
      { role: "body", sourcePath: bodyPath },
    ],
    externalFiles: [],
  }
}
