import { describe, expect, it } from "vitest"
import { encodeConfigurationIndexFragments } from "../configurationIndex/fragment"
import type {
  FullXmlSyncAssignment,
  FullXmlSyncDiagnostic,
  FullXmlSyncWorkerCommand,
} from "./types"
import {
  createFullXmlSyncWorkerPool,
  normalizeFullXmlSyncConcurrency,
  type FullXmlSyncWorkerThreadPool,
} from "./workerPool"

describe("full XML sync worker pool", () => {
  const context = { version: "2.20", defaultLanguage: "ru", exportToYAML: { toTyped: false } } as const

  it("uses static round-robin and keeps one assignment on the same worker between passes", async () => {
    const pools = createFakePools()
    const assignments = [assignment("one"), assignment("two"), assignment("three")]
    const pool = createFullXmlSyncWorkerPool({ concurrency: 2, createWorkerPool: pools.factory })

    await pool.initialize({ projectDir: "/project", outputDir: "/out", context })
    await pool.runFirstPass(assignments)
    await pool.runSecondPass({ sharedMetadata: {} as never, index: {} as never, generationSeed: new Uint8Array() })

    expect(pools.runs(0).map((task) => task.kind)).toEqual(["initialize", "firstPass", "secondPass"])
    expect(pools.runs(1).map((task) => task.kind)).toEqual(["initialize", "firstPass", "secondPass"])
    expect(pools.firstPassIds(0)).toEqual(["one", "three"])
    expect(pools.firstPassIds(1)).toEqual(["two"])

    await pool.close()
  })

  it("does not start empty workers and still uses a worker when concurrency is one", async () => {
    const pools = createFakePools()
    const pool = createFullXmlSyncWorkerPool({ concurrency: 4, createWorkerPool: pools.factory })

    await pool.initialize({ projectDir: "/project", outputDir: "/out", context })
    await pool.runFirstPass([assignment("only")])

    expect(pools.created()).toBe(1)
    expect(pools.runs(0).map((task) => task.kind)).toEqual(["initialize", "firstPass"])
    await pool.close()
    expect(pools.destroyCalls()).toEqual([1])

    const single = createFakePools()
    const singlePool = createFullXmlSyncWorkerPool({ concurrency: 1, createWorkerPool: single.factory })
    await singlePool.initialize({ projectDir: "/project", outputDir: "/out", context })
    await singlePool.runFirstPass([assignment("single")])
    expect(single.created()).toBe(1)
    await singlePool.close()
  })

  it("returns compact first-pass data and blocks second pass after errors", async () => {
    const pools = createFakePools()
    pools.diagnoseWorker(1, {
      severity: "error",
      code: "syntax",
      message: "bad yaml",
      assignmentId: "two",
      sourceProjectPath: "two.yaml",
    })
    const pool = createFullXmlSyncWorkerPool({ concurrency: 2, createWorkerPool: pools.factory })

    await pool.initialize({ projectDir: "/project", outputDir: "/out", context })
    const first = await pool.runFirstPass([assignment("one"), assignment("two")])

    expect(first.diagnostics).toEqual([expect.objectContaining({ severity: "error", assignmentId: "two" })])
    expect(first.projectFiles.map((file) => file.projectPath)).toEqual(["one.yaml", "two.yaml"])
    expect(first.ownerFacts).toEqual([expect.objectContaining({ assignmentId: "one" })])
    await expect(
      pool.runSecondPass({ sharedMetadata: {} as never, index: {} as never, generationSeed: new Uint8Array() })
    ).rejects.toThrow("Первый проход full XML sync завершён с ошибками")
    await pool.close()
  })

  it("destroys every worker without retry after crash", async () => {
    const pools = createFakePools()
    pools.failWorker(1, new Error("worker crashed"))
    const pool = createFullXmlSyncWorkerPool({ concurrency: 2, createWorkerPool: pools.factory })

    await pool.initialize({ projectDir: "/project", outputDir: "/out", context })
    await expect(pool.runFirstPass([assignment("one"), assignment("two")])).rejects.toThrow("worker crashed")

    expect(pools.destroyCalls()).toEqual([1, 1])
    expect(pools.firstPassIds(1)).toEqual(["two"])
    await pool.close()
    expect(pools.destroyCalls()).toEqual([1, 1])
  })

  it("normalizes default concurrency and rejects invalid explicit values", () => {
    expect(normalizeFullXmlSyncConcurrency(undefined)).toBeGreaterThanOrEqual(1)
    expect(normalizeFullXmlSyncConcurrency(undefined)).toBeLessThanOrEqual(4)
    expect(() => normalizeFullXmlSyncConcurrency(0)).toThrow("положительным целым")
    expect(normalizeFullXmlSyncConcurrency(2)).toBe(2)
  })
})

function assignment(id: string): FullXmlSyncAssignment {
  return {
    id,
    sourceProjectPath: `${id}.yaml`,
    sourcePath: `/project/${id}.yaml`,
    role: "properties",
    itemType: "MetadataCatalog",
    itemName: id,
    logicalAddress: `Справочник.${id}`,
    outputs: [{ routeKind: "owner", targetXmlPath: `${id}.xml` }],
  }
}

function createFakePools() {
  const commands: FullXmlSyncWorkerCommand[][] = []
  const destroyCounts: number[] = []
  const failures = new Map<number, Error>()
  const diagnostics = new Map<number, FullXmlSyncDiagnostic[]>()

  return {
    factory(): FullXmlSyncWorkerThreadPool {
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
              diagnostics: diagnostics.get(workerIndex) ?? [],
              projectFiles: task.assignments.map((item) => ({ projectPath: item.sourceProjectPath, contentHash: 1n })),
              ownerFacts:
                workerIndex === 0
                  ? task.assignments.map((item) => ({
                      assignmentId: item.id,
                      sourceProjectPath: item.sourceProjectPath,
                      sourcePath: item.sourcePath,
                      role: item.role,
                      owner: { dir: "Справочник", name: item.itemName },
                      itemType: item.itemType,
                    }))
                  : [],
            }
          }
          if (task.kind === "secondPass") {
            return {
              kind: "secondPassResult" as const,
              diagnostics: [],
              warnings: [],
              writtenFiles: [],
              fragmentBuffer: encodeConfigurationIndexFragments([]),
            }
          }
          return undefined
        },
        async destroy() {
          destroyCounts[workerIndex] = (destroyCounts[workerIndex] ?? 0) + 1
        },
      }
    },
    runs(workerIndex: number): FullXmlSyncWorkerCommand[] {
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
    diagnoseWorker(workerIndex: number, diagnostic: FullXmlSyncDiagnostic): void {
      diagnostics.set(workerIndex, [diagnostic])
    },
    destroyCalls(): number[] {
      return [...destroyCounts]
    },
  }
}
