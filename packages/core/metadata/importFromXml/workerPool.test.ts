import fs from "node:fs"
import os from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { afterEach, describe, expect, it } from "vitest"
import { mockContextFromXML } from "../../tests/mockContext"
import { encodeConfigurationIndexFragments } from "../configurationIndex/fragment"
import { createConfigurationIndexCollector } from "../configurationIndex/collector/writer"
import { createImportSharedMetadata } from "./metadataSnapshot"
import { prepareImportYaml } from "./prepareYaml"
import type { ImportAssignment, ImportDiagnostic, ImportWorkerCommand } from "./types"
import {
  createXmlImportWorkerPool,
  createXmlImportWorkerPoolHandle,
  type XmlImportWorkerThreadPool,
} from "./workerPool"

const syncXmlDir = join(import.meta.dirname, "../appliedObjects/configuration/__fixtures__/syncConfiguration/xml")
const repoRoot = fileURLToPath(new URL("../../../../", import.meta.url))
const tempDirs: string[] = []

afterEach(() => {
  for (const dir of tempDirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true })
})

describe("XML import worker pool", () => {
  it("sends one command per pass to each active worker with static round-robin assignments", async () => {
    const pools = createFakePools()
    const assignments = [assignment("one"), assignment("two"), assignment("three")]
    const pool = createXmlImportWorkerPool({ concurrency: 2, createWorkerPool: pools.factory })

    await pool.initialize({ operationId: "op", context: mockContextFromXML(), outputDir: createTempDir("static") })
    await pool.runFirstPass(assignments)
    await pool.runSecondPass(createImportSharedMetadata([]))

    expect(pools.runs(0).map((task) => task.kind)).toEqual(["initialize", "firstPass", "secondPass"])
    expect(pools.runs(1).map((task) => task.kind)).toEqual(["initialize", "firstPass", "secondPass"])
    expect(pools.firstPassIds(0)).toEqual([assignments[0]?.id, assignments[2]?.id])
    expect(pools.firstPassIds(1)).toEqual([assignments[1]?.id])

    await pool.close()
  })

  it("does not create physical workers for empty partitions", async () => {
    const pools = createFakePools()
    const pool = createXmlImportWorkerPool({ concurrency: 4, createWorkerPool: pools.factory })

    await pool.initialize({ operationId: "op", context: mockContextFromXML(), outputDir: createTempDir("active") })
    await pool.runFirstPass([assignment("only")])

    expect(pools.created()).toBe(1)
    await pool.close()
  })

  it("does not start second pass when any first-pass diagnostic is an error", async () => {
    const pools = createFakePools()
    pools.diagnoseWorker(1, {
      severity: "error",
      code: "xml_import_assignment_failed",
      message: "broken XML",
      targetProjectPath: "Справочник/two/Свойства.yaml",
    })
    const pool = createXmlImportWorkerPool({ concurrency: 2, createWorkerPool: pools.factory })

    await pool.initialize({ operationId: "op", context: mockContextFromXML(), outputDir: createTempDir("diagnostic") })
    const result = await pool.runFirstPass([assignment("one"), assignment("two")])

    expect(result.diagnostics).toContainEqual(expect.objectContaining({ severity: "error" }))
    await expect(pool.runSecondPass(createImportSharedMetadata([]))).rejects.toThrow(
      "Первый проход import завершён с ошибками"
    )
    expect(pools.runs(0).map((task) => task.kind)).toEqual(["initialize", "firstPass"])
    expect(pools.runs(1).map((task) => task.kind)).toEqual(["initialize", "firstPass"])

    await pool.close()
  })

  it("destroys every worker without retry and preserves temp data after a worker crash", async () => {
    const pools = createFakePools()
    pools.failWorker(1, new Error("worker exited"))
    const outputDir = createTempDir("crash")
    const sentinelPath = join(outputDir, "partial.yaml")
    fs.mkdirSync(outputDir, { recursive: true })
    fs.writeFileSync(sentinelPath, "partial")
    const pool = createXmlImportWorkerPool({ concurrency: 2, createWorkerPool: pools.factory })

    await pool.initialize({ operationId: "op", context: mockContextFromXML(), outputDir })
    await expect(pool.runFirstPass([assignment("one"), assignment("two")])).rejects.toThrow("worker exited")

    expect(pools.destroyCalls()).toEqual([1, 1])
    expect(pools.firstPassIds(1)).toEqual(["two"])
    expect(fs.readFileSync(sentinelPath, "utf-8")).toBe("partial")
    await pool.close()
    expect(pools.destroyCalls()).toEqual([1, 1])
  })

  it("passes a real fragment buffer through Piscina when started outside the core package", async () => {
    const source = assignment("real", {
      itemName: "Контрагенты",
      logicalAddress: "Справочник.Контрагенты",
      targetProjectPath: "Справочник/Контрагенты/Свойства.yaml",
      xmlFiles: [{ role: "metadata", sourcePath: join(syncXmlDir, "Catalogs/Контрагенты.xml") }],
    })
    const context = mockContextFromXML()
    const collector = createConfigurationIndexCollector()
    await prepareImportYaml({ assignment: source, context, collector })
    const expected = collector.fragment(source.targetProjectPath)
    const pool = createXmlImportWorkerPool({ concurrency: 1 })
    const originalCwd = process.cwd()
    process.chdir(repoRoot)

    try {
      await pool.initialize({ operationId: "real", context, outputDir: createTempDir("piscina") })
      const result = await pool.runFirstPass([source])

      expect(result.diagnostics).toEqual([])
      expect(result.fragmentData).toEqual({
        identities: expected.identities,
        xmlNodes: expected.xmlNodes,
        xmlValues: expected.xmlValues,
      })
    } finally {
      try {
        await pool.close()
      } finally {
        process.chdir(originalCwd)
      }
    }
  }, 30_000)

  it("reuses physical workers across operation pools created by a handle", async () => {
    const pools = createFakePools()
    const handle = createXmlImportWorkerPoolHandle({ concurrency: 2, createWorkerPool: pools.factory })

    try {
      const firstOperation = handle.createOperationPool()
      await firstOperation.initialize({ operationId: "one", context: mockContextFromXML(), outputDir: createTempDir("one") })
      await firstOperation.runFirstPass([assignment("one-a"), assignment("one-b")])
      await firstOperation.runSecondPass(createImportSharedMetadata([]))
      await firstOperation.close()

      const secondOperation = handle.createOperationPool()
      await secondOperation.initialize({ operationId: "two", context: mockContextFromXML(), outputDir: createTempDir("two") })
      await secondOperation.runFirstPass([assignment("two-a"), assignment("two-b")])
      await secondOperation.runSecondPass(createImportSharedMetadata([]))
      await secondOperation.close()

      expect(pools.created()).toBe(2)
      expect(handle.size()).toBe(2)
      expect(pools.runs(0).map((task) => task.kind)).toEqual([
        "initialize",
        "firstPass",
        "secondPass",
        "dispose",
        "initialize",
        "firstPass",
        "secondPass",
        "dispose",
      ])
      expect(pools.firstPassIds(0)).toEqual(["one-a", "two-a"])
      expect(pools.destroyCalls()).toEqual([0, 0])
    } finally {
      await handle.close()
    }

    expect(pools.destroyCalls()).toEqual([1, 1])
  })
})

function assignment(id: string, overrides: Partial<ImportAssignment> = {}): ImportAssignment {
  return {
    id,
    role: "properties",
    targetProjectPath: `Справочник/${id}/Свойства.yaml`,
    itemType: "MetadataCatalog",
    itemName: id,
    logicalAddress: `Справочник.${id}`,
    owner: undefined,
    xmlFiles: [{ role: "metadata", sourcePath: `/xml/${id}.xml` }],
    externalFiles: [],
    ...overrides,
  }
}

function createFakePools() {
  const commands: ImportWorkerCommand[][] = []
  const destroyCounts: number[] = []
  const failures = new Map<number, Error>()
  const diagnostics = new Map<number, ImportDiagnostic[]>()

  return {
    factory(): XmlImportWorkerThreadPool {
      const workerIndex = commands.length
      commands.push([])
      destroyCounts.push(0)
      return {
        async run(task) {
          commands[workerIndex]?.push(task)
          if (task.kind === "firstPass") {
            const failure = failures.get(workerIndex)
            if (failure !== undefined) throw failure
            return {
              kind: "firstPassResult" as const,
              ownerFacts: [],
              diagnostics: diagnostics.get(workerIndex) ?? [],
              fragmentBuffer: encodeConfigurationIndexFragments(
                task.assignments.map((item) => ({
                  targetProjectPath: item.targetProjectPath,
                  identities: [],
                  xmlNodes: [],
                  xmlValues: [],
                }))
              ),
            }
          }
          if (task.kind === "secondPass") {
            return { kind: "secondPassResult" as const, diagnostics: [], warnings: [], files: [] }
          }
          return undefined
        },
        async destroy() {
          destroyCounts[workerIndex] = (destroyCounts[workerIndex] ?? 0) + 1
        },
      }
    },
    runs(workerIndex: number): ImportWorkerCommand[] {
      return commands[workerIndex] ?? []
    },
    firstPassIds(workerIndex: number): string[] {
      return (commands[workerIndex] ?? []).flatMap((task) =>
        task.kind === "firstPass" ? task.assignments.map((item) => item.id) : []
      )
    },
    created(): number {
      return commands.length
    },
    failWorker(workerIndex: number, error: Error): void {
      failures.set(workerIndex, error)
    },
    diagnoseWorker(workerIndex: number, diagnostic: ImportDiagnostic): void {
      diagnostics.set(workerIndex, [diagnostic])
    },
    destroyCalls(): number[] {
      return [...destroyCounts]
    },
  }
}

function createTempDir(name: string): string {
  const dir = fs.mkdtempSync(join(os.tmpdir(), `nkdk-worker-pool-${name}-`))
  tempDirs.push(dir)
  return dir
}
