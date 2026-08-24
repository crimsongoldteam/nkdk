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

describe("executeImportControlExport", () => {
  const tempDirs: string[] = []

  beforeAll(() => {
    topology = createValidationProjectComponent("/project", { kind: "configuration" }).topology
    const node = topology.assignments.find(
      ({ projectPattern }) => projectPattern === "Справочник/{ownerName}/Свойства.yaml",
    )
    if (node === undefined) throw new Error("Не найден topology-узел справочника")
    catalogNode = node
  })
  beforeEach(resetControlExportCountForTests)
  afterEach(() => {
    for (const dir of tempDirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true })
  })

  it("выполняет один обычный экспорт assignment независимо от числа PropertyRule", async () => {
    const ordinaryExporter = vi.fn(prepareFullXmlSyncAssignment)
    const { prepared, initialAnnotations, result } = await runCatalogControlExport(undefined, ordinaryExporter)

    expect(Object.keys(prepared.rule.properties).length).toBeGreaterThan(10)
    expect(newAnnotationKeys(initialAnnotations, result.annotations)).toEqual(["Properties\\#order"])
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

  it("исключает существующий raw payload из ordinary PropertyRule", async () => {
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

    expect((result.data as Record<string, unknown>).ТипКода).toBe("Число")
    expect(result.annotations.entries).toEqual(expect.arrayContaining(annotations.entries))
    expect(newAnnotationKeys(annotations, result.annotations)).toEqual(["Properties\\#order"])
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
      "Properties\\#order",
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
      "Properties\\#order",
    ])
    expect(controlExportCountForTests()).toBe(1)
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
  const collector = createConfigurationIndexCollector()
  const prepared = await prepareImportYaml({
    assignment: catalogAssignment(sourcePath),
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
