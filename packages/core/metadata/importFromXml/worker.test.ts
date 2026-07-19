import { join } from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { transferableSymbol, valueSymbol } from "piscina"
import { mockContextFromXML } from "../../tests/mockContext"
import { decodeConfigurationIndexFragments } from "../configurationIndex/fragment"
import type { ImportFirstPassResult } from "./types"
import {
  createFirstPassTransferable,
  resetImportWorkerStateForTests,
  runImportWorkerCommand,
  workerStateForTests,
} from "./worker"
import type { ImportAssignment } from "./types"

const syncXmlDir = join(import.meta.dirname, "../appliedObjects/configuration/__fixtures__/syncConfiguration/xml")

beforeEach(async () => {
  resetImportWorkerStateForTests()
  await runImportWorkerCommand({
    kind: "initialize",
    operationId: "test-operation",
    workerIndex: 2,
    context: mockContextFromXML(),
    tempDir: "/tmp/nkdk-import-worker-2",
  })
})

afterEach(() => {
  resetImportWorkerStateForTests()
})

describe("XML import worker first pass", () => {
  it("retains models locally and returns only owner facts and an index fragment buffer", async () => {
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
      preparedIds: [assignment.id],
    })
    expect(workerStateForTests()).not.toHaveProperty("preparedModels")
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
    expect(workerStateForTests().preparedIds).toEqual([valid.id])
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

  it("releases retained models on dispose", async () => {
    await runImportWorkerCommand({ kind: "firstPass", assignments: [catalogAssignment()] })

    await runImportWorkerCommand({ kind: "dispose" })

    expect(workerStateForTests().preparedIds).toEqual([])
    expect(workerStateForTests().initialized).toBe(false)
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
