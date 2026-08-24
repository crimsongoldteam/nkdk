import fs from "node:fs"
import os from "node:os"
import { join } from "node:path"
import {
  createConfigurationIndexCollector,
  createLocalConfigurationIndexReader,
  snapshotXmlAnomalyAnnotations,
} from "@nkdk/runtime"
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest"
import { mockXmlImportContext } from "../../tests/mockContext"
import "../../tests/metadataExecutionContext"
import { createValidationProjectComponent } from "../validation/projectComponents"
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
    const { prepared, initialAnnotations, result } = await runCatalogControlExport()

    expect(Object.keys(prepared.rule.properties).length).toBeGreaterThan(10)
    expect(result.annotations).toEqual(initialAnnotations)
    expect(controlExportCountForTests()).toBe(1)
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

    expect((result.data as Record<string, unknown>).ДлинаКода).toBe("01")
    expect(result.annotations.entries).toEqual(expect.arrayContaining([
      expect.objectContaining({ parentPath: [], key: "ДлинаКода", annotation: { kind: "raw", occurrence: 1, target: "value" } }),
    ]))
    expect(result.rereadSourcePaths).toEqual([sourcePath])
    expect(newAnnotationKeys(initialAnnotations, result.annotations)).toEqual(["ДлинаКода"])
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

    expect((result.data as Record<string, unknown>).ДлинаКода).toEqual({
      "_xsi:type": "xs:future",
      "#text": "9",
    })
    expect(result.annotations.entries).toEqual(expect.arrayContaining([
      expect.objectContaining({
        parentPath: [],
        key: "ДлинаКода",
        annotation: expect.objectContaining({ kind: "raw" }),
      }),
    ]))
    expect(newAnnotationKeys(initialAnnotations, result.annotations)).toEqual(["ДлинаКода"])
    expect(controlExportCountForTests()).toBe(1)
  })
})

async function runCatalogControlExport(sourcePath?: string) {
  const collector = createConfigurationIndexCollector()
  const prepared = await prepareImportYaml({
    assignment: catalogAssignment(sourcePath),
    context: mockXmlImportContext(),
    collector,
    topology,
  })
  const fragment = collector.fragment(prepared.targetProjectPath)
  const initialAnnotations = snapshotXmlAnomalyAnnotations(prepared.yaml, prepared.annotations)
  const result = await executeImportControlExport({
    assignment: prepared.assignment,
    data: prepared.yaml,
    annotations: initialAnnotations,
    audit: prepared.proofAudit,
    topology,
    context: mockXmlImportContext(),
    index: createLocalConfigurationIndexReader(new Map([
      [fragment.targetProjectPath, { entities: fragment.entities }],
    ])),
    composition: catalogComposition(),
    readSource: async (path) => fs.promises.readFile(path, "utf8"),
  })
  return { prepared, initialAnnotations, result }
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
