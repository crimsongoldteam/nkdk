import fs from "node:fs"
import os from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { mockContextFromXML } from "../../tests/mockContext"
import type { ConfigurationIndexData } from "../configurationIndex"
import { createImportSharedMetadata } from "./metadataSnapshot"
import {
  importConfigurationFromXml,
  type ImportConfigurationFromXmlParams,
  type ImportCoordinatorDependencies,
} from "./importConfiguration"
import type { ImportAssignment, ImportDiagnostic, ImportResultFile } from "./types"

const failurePhases = [
  "discover",
  "firstPass",
  "mergeMetadata",
  "secondPass",
  "mergeFiles",
  "transfer",
  "hashProject",
  "writeIndex",
] as const

type FailurePhase = (typeof failurePhases)[number]

const assignments: ImportAssignment[] = [assignment("Контрагенты"), assignment("Номенклатура")]
const resultFiles: ImportResultFile[] = [
  {
    sourceKind: "worker",
    sourcePath: "/temp/Свойства.yaml",
    targetProjectPath: "Справочник/Контрагенты/Свойства.yaml",
  },
]
const fragmentData: Pick<ConfigurationIndexData, "identities" | "xmlNodes" | "xmlValues"> = {
  identities: [{ logicalAddress: "Справочник.Контрагенты", kind: "uuid", value: "new-uuid" }],
  xmlNodes: [{ logicalAddress: "Справочник.Контрагенты", present: ["Name"] }],
  xmlValues: [{ logicalAddress: "Справочник.Контрагенты.Name", xmlText: "Контрагенты" }],
}

const tempDirs: string[] = []

afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0).map((directory) => fs.promises.rm(directory, { recursive: true, force: true }))
  )
})

describe("configuration XML import coordinator", () => {
  it("writes the index after transfer and hashing and removes temp last", async () => {
    const calls: string[] = []
    const params = createParams()
    const writtenIndexes: ConfigurationIndexData[] = []

    const result = await importConfigurationFromXml(
      params,
      fakeDependencies({ calls, writtenIndexes })
    )

    expect(calls).toEqual([
      "discover",
      "firstPass",
      "mergeMetadata",
      "secondPass",
      "mergeFiles",
      "transfer",
      "hashProject",
      "writeIndex",
      "removeTemp",
      "closeWorkers",
    ])
    expect(result).toEqual({
      succeeded: assignments.length,
      failed: [],
      warnings: [],
      configurationIndexPath: join(params.outputDir, ".nkdk", "configuration-index", "default.bin"),
    })
    expect(writtenIndexes).toHaveLength(1)
  })

  it.each(failurePhases)("preserves temp and does not cross the %s failure barrier", async (failurePhase) => {
    const calls: string[] = []
    const params = createParams()
    const result = await importConfigurationFromXml(params, fakeDependencies({ calls, failurePhase }))

    expect(result).toMatchObject({
      succeeded: 0,
      failed: [expect.objectContaining({ severity: "error", message: `${failurePhase} failed` })],
      warnings: [],
      preservedTempRoot: join(params.outputDir, ".nkdk", "tmp", "import", params.operationId!),
    })
    expect(calls.includes("writeIndex")).toBe(failurePhase === "writeIndex")
    expect(calls).not.toContain("removeTemp")
    expect(calls.at(-1)).toBe("closeWorkers")
  })

  it("does not roll back files already published before a transfer failure", async () => {
    const calls: string[] = []
    const params = createParams()
    const publishedPath = join(params.outputDir, "already-published.yaml")
    const dependencies = fakeDependencies({ calls })
    dependencies.transfer = async () => {
      calls.push("transfer")
      await fs.promises.writeFile(publishedPath, "published")
      throw new Error("transfer failed")
    }

    const result = await importConfigurationFromXml(params, dependencies)

    expect(result.failed).toHaveLength(1)
    expect(await fs.promises.readFile(publishedPath, "utf8")).toBe("published")
    expect(calls).not.toContain("writeIndex")
    expect(calls).not.toContain("removeTemp")
  })

  it("stops after first-pass diagnostics with errors and closes workers", async () => {
    const calls: string[] = []
    const diagnostic = importError("broken first pass")
    const params = createParams()
    const dependencies = fakeDependencies({ calls })
    const pool = dependencies.createWorkerPool({ concurrency: 1 })
    dependencies.createWorkerPool = () => ({
      ...pool,
      async runFirstPass() {
        calls.push("firstPass")
        return { diagnostics: [diagnostic], ownerFacts: [], fragmentData }
      },
    })

    const result = await importConfigurationFromXml(params, dependencies)

    expect(result.failed).toEqual([diagnostic])
    expect(result.preservedTempRoot).toBe(join(params.outputDir, ".nkdk", "tmp", "import", params.operationId!))
    expect(calls).toEqual(["discover", "firstPass", "closeWorkers"])
  })

  it("preserves second-pass warnings when its diagnostics contain errors", async () => {
    const calls: string[] = []
    const diagnostic = importError("broken second pass")
    const warning: ImportDiagnostic = {
      severity: "warning",
      code: "unresolved_data_path",
      message: "unresolved",
      targetProjectPath: "Справочник/Контрагенты/Формы/ФормаЭлемента/Форма.yaml",
    }
    const params = createParams()
    const dependencies = fakeDependencies({ calls })
    const pool = dependencies.createWorkerPool({ concurrency: 1 })
    dependencies.createWorkerPool = () => ({
      ...pool,
      async runSecondPass() {
        calls.push("secondPass")
        return { diagnostics: [diagnostic], warnings: [warning], files: [] }
      },
    })

    const result = await importConfigurationFromXml(params, dependencies)

    expect(result.failed).toEqual([diagnostic])
    expect(result.warnings).toEqual([warning])
    expect(calls).toEqual(["discover", "firstPass", "mergeMetadata", "secondPass", "closeWorkers"])
  })

  it("increments a readable index generation without reusing its project or XML facts", async () => {
    const calls: string[] = []
    const params = createParams()
    const writtenIndexes: ConfigurationIndexData[] = []
    const previousIndex = configurationIndex(7n, {
      projectFiles: [{ projectPath: "old.yaml", contentHash: 1n }],
      identities: [{ logicalAddress: "old", kind: "uuid", value: "old-uuid" }],
      xmlNodes: [{ logicalAddress: "old" }],
      xmlValues: [{ logicalAddress: "old", xmlText: "old" }],
    })

    await importConfigurationFromXml(
      params,
      fakeDependencies({ calls, previousIndex, writtenIndexes })
    )

    expect(writtenIndexes).toEqual([
      configurationIndex(8n, {
        projectFiles: [{ projectPath: "Конфигурация.yaml", contentHash: 42n }],
        ...fragmentData,
      }),
    ])
  })

  it("starts index generation at one when the previous index is unreadable", async () => {
    const params = createParams()
    const writtenIndexes: ConfigurationIndexData[] = []
    const dependencies = fakeDependencies({ calls: [], writtenIndexes })
    dependencies.readIndex = async () => {
      throw new Error("corrupt index")
    }

    await importConfigurationFromXml(params, dependencies)

    expect(writtenIndexes[0]?.binding.indexGeneration).toBe(1n)
  })
})

function createParams(): ImportConfigurationFromXmlParams {
  const outputDir = fs.mkdtempSync(join(os.tmpdir(), "nkdk-import-coordinator-"))
  tempDirs.push(outputDir)
  return {
    context: mockContextFromXML(),
    inputDir: "/xml",
    outputDir,
    concurrency: 2,
    operationId: "task-8",
  }
}

function fakeDependencies(params: {
  calls: string[]
  failurePhase?: FailurePhase
  previousIndex?: ConfigurationIndexData
  writtenIndexes?: ConfigurationIndexData[]
}): ImportCoordinatorDependencies {
  const call = (phase: FailurePhase): void => {
    params.calls.push(phase)
    if (params.failurePhase === phase) throw new Error(`${phase} failed`)
  }

  return {
    createWorkerPool() {
      return {
        async initialize() {},
        async runFirstPass() {
          call("firstPass")
          return { diagnostics: [], ownerFacts: [], fragmentData }
        },
        async runSecondPass() {
          call("secondPass")
          return { diagnostics: [], warnings: [], files: resultFiles }
        },
        async close() {
          params.calls.push("closeWorkers")
        },
      }
    },
    async discover() {
      call("discover")
      return { assignments }
    },
    createSharedMetadata() {
      call("mergeMetadata")
      return createImportSharedMetadata([])
    },
    mergeFiles(files) {
      call("mergeFiles")
      return [...files]
    },
    async transfer() {
      call("transfer")
    },
    async hashProject() {
      call("hashProject")
      return [{ projectPath: "Конфигурация.yaml", contentHash: 42n }]
    },
    async readIndex() {
      return params.previousIndex
    },
    async writeIndex({ data }) {
      call("writeIndex")
      params.writtenIndexes?.push(data)
    },
    async removeTemp() {
      params.calls.push("removeTemp")
    },
  }
}

function assignment(name: string): ImportAssignment {
  return {
    id: `Справочник/${name}/Свойства.yaml`,
    role: "properties",
    targetProjectPath: `Справочник/${name}/Свойства.yaml`,
    itemType: "MetadataCatalog",
    itemName: name,
    logicalAddress: `Справочник.${name}`,
    owner: undefined,
    xmlFiles: [{ role: "metadata", sourcePath: `/xml/Catalogs/${name}.xml` }],
    externalFiles: [],
  }
}

function importError(message: string): ImportDiagnostic {
  return {
    severity: "error",
    code: "xml_import_assignment_failed",
    message,
    targetProjectPath: "Справочник/Контрагенты/Свойства.yaml",
  }
}

function configurationIndex(
  indexGeneration: bigint,
  data: Pick<ConfigurationIndexData, "projectFiles" | "identities" | "xmlNodes" | "xmlValues">
): ConfigurationIndexData {
  return {
    binding: {
      indexGeneration,
      producerVersion: "0.0.0-dev",
      baseId: "default",
      baseFingerprint: new Uint8Array(),
      configurationVersion: new Uint8Array(),
    },
    ...data,
  }
}
