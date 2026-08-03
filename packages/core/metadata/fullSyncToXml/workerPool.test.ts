import { describe, expect, it } from "vitest"
import { createMockWorkerThreadPoolFactory } from "../../tests/mockWorkerThreadPool"
import { encodeConfigurationIndexFragments } from "../configurationIndex/fragment"
import { entity, fragment } from "../configurationIndex/testData"
import type { FullXmlSyncAssignment, FullXmlSyncDiagnostic, FullXmlSyncWorkerCommand } from "./types"
import {
  createFullXmlSyncWorkerPool,
  normalizeFullXmlSyncConcurrency,
  type FullXmlSyncWorkerInitialization,
} from "./workerPool"
import { fullXmlSyncTestOutput } from "./testTopology"
import { createTestProjectStateReadToken } from "../projectState/tests/readToken"

describe("full XML sync worker pool", () => {
  const initialization = {
    componentPath: "cf",
    componentDir: "/project",
    outputDir: "/out",
    context: {
      version: "2.20",
      defaultLanguage: "ru",
      exportToYAML: { toTyped: false },
    },
    profile: {
      kind: "configuration",
      componentKind: "configuration",
      adoptedUuids: {},
    },
    composition: {} as never,
    targetIndex: {} as never,
    projectStateReadTokens: [1, 2, 3, 4].map(() => createTestProjectStateReadToken()),
  } satisfies FullXmlSyncWorkerInitialization

  it("executes each static partition once", async () => {
    const pools = createFakePools()
    const assignments = [assignment("one"), assignment("two"), assignment("three")]
    const pool = createFullXmlSyncWorkerPool({
      concurrency: 2,
      createWorkerPool: pools.factory,
    })

    await pool.initialize(initialization)
    await pool.execute(assignments)

    expect(pools.runs(0).map(({ kind }) => kind)).toEqual(["initialize", "execute"])
    expect(pools.runs(1).map(({ kind }) => kind)).toEqual(["initialize", "execute"])
    expect(pools.executeIds(0)).toEqual(["one", "three"])
    expect(pools.executeIds(1)).toEqual(["two"])
    await expect(pool.execute(assignments)).rejects.toThrow("уже было запущено")
    await pool.close()
    expect(pools.runs(0).map(({ kind }) => kind)).toEqual(["initialize", "execute", "dispose"])
    expect(pools.runs(1).map(({ kind }) => kind)).toEqual(["initialize", "execute", "dispose"])
  })

  it("does not start empty workers", async () => {
    const pools = createFakePools()
    const pool = createFullXmlSyncWorkerPool({
      concurrency: 4,
      createWorkerPool: pools.factory,
    })

    await pool.initialize(initialization)
    await pool.execute([assignment("only")])

    expect(pools.created()).toBe(1)
    expect(pools.runs(0).map(({ kind }) => kind)).toEqual(["initialize", "execute"])
    await pool.close()
    expect(pools.destroyCalls()).toEqual([1])
  })

  it("merges execution results from workers", async () => {
    const pools = createFakePools()
    pools.returnFragments(0, [fragment("one.yaml")])
    pools.returnFragments(1, [fragment("two.yaml", entity("Справочник.two", "two.yaml"))])
    pools.diagnoseWorker(1, {
      severity: "error",
      code: "syntax",
      message: "bad yaml",
      assignmentId: "two",
      sourceProjectPath: "two.yaml",
    })
    const pool = createFullXmlSyncWorkerPool({
      concurrency: 2,
      createWorkerPool: pools.factory,
    })

    await pool.initialize(initialization)
    const result = await pool.execute([assignment("one"), assignment("two")])

    expect(result.diagnostics).toEqual([expect.objectContaining({ severity: "error", assignmentId: "two" })])
    expect(result.expectedOutputs).toHaveLength(2)
    expect(result.fragmentData).toEqual({
      sourceProjectPaths: ["one.yaml", "two.yaml"],
      entities: [entity("Справочник.two", "two.yaml")],
    })
    await pool.close()
  })

  it("destroys every worker without retry after crash", async () => {
    const pools = createFakePools()
    pools.failWorker(1, new Error("worker crashed"))
    const pool = createFullXmlSyncWorkerPool({
      concurrency: 2,
      createWorkerPool: pools.factory,
    })

    await pool.initialize(initialization)
    await expect(pool.execute([assignment("one"), assignment("two")])).rejects.toThrow("worker crashed")

    expect(pools.destroyCalls()).toEqual([1, 1])
    expect(pools.runs(0).map(({ kind }) => kind)).toContain("dispose")
    expect(pools.runs(1).map(({ kind }) => kind)).toContain("dispose")
    await pool.close()
    expect(pools.destroyCalls()).toEqual([1, 1])
  })

  it("preserves a crash as primary and aggregates dispose and destroy failures", async () => {
    const primary = new Error("execute failed")
    const disposeFailure = new Error("dispose failed")
    const destroyFailure = new Error("destroy failed")
    const commands: string[] = []
    let destroyCalls = 0
    const pool = createFullXmlSyncWorkerPool({
      concurrency: 1,
      createWorkerPool: () => ({
        async run(command) {
          commands.push(command.kind)
          if (command.kind === "execute") throw primary
          if (command.kind === "dispose") throw disposeFailure
          return undefined
        },
        async destroy() {
          destroyCalls += 1
          throw destroyFailure
        },
      }),
    })
    await pool.initialize(initialization)

    let failure: unknown
    try {
      await pool.execute([assignment("one")])
    } catch (caught) {
      failure = caught
    }

    expect(failure).toBeInstanceOf(AggregateError)
    expect((failure as AggregateError).errors).toEqual([primary, disposeFailure, destroyFailure])
    expect((failure as Error).message).toBe(primary.message)
    expect(commands).toEqual(["initialize", "execute", "dispose"])
    expect(destroyCalls).toBe(1)
  })

  it("destroys a worker even when normal dispose fails", async () => {
    const disposeFailure = new Error("dispose failed")
    let destroyCalls = 0
    const pool = createFullXmlSyncWorkerPool({
      concurrency: 1,
      createWorkerPool: () => ({
        async run(command) {
          if (command.kind === "dispose") throw disposeFailure
          if (command.kind !== "execute") return undefined
          return executionResult()
        },
        async destroy() { destroyCalls += 1 },
      }),
    })
    await pool.initialize(initialization)
    await pool.execute([assignment("one")])

    await expect(pool.close()).rejects.toBe(disposeFailure)
    expect(destroyCalls).toBe(1)
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
    expectedContentHash: 0n,
    role: "properties",
    itemType: "MetadataCatalog",
    itemName: id,
    logicalAddress: `Справочник.${id}`,
    ...fullXmlSyncTestOutput(`${id}.xml`),
  }
}

function executionResult() {
  return {
    kind: "executionResult" as const,
    diagnostics: [],
    warnings: [],
    writtenFiles: [],
    expectedOutputs: [],
    fragmentBuffer: encodeConfigurationIndexFragments([]),
  }
}

function createFakePools() {
  const failures = new Map<number, Error>()
  const diagnostics = new Map<number, FullXmlSyncDiagnostic[]>()
  const fragments = new Map<number, Parameters<typeof encodeConfigurationIndexFragments>[0]>()
  const pools = createMockWorkerThreadPoolFactory<
    FullXmlSyncWorkerCommand,
    unknown
  >(async (task, workerIndex) => {
    if (task.kind !== "execute") return undefined
    const failure = failures.get(workerIndex)
    if (failure !== undefined) throw failure
    return {
      kind: "executionResult" as const,
      diagnostics: diagnostics.get(workerIndex) ?? [],
      warnings: [],
      writtenFiles: [],
      expectedOutputs: task.assignments.map(({ id }) => ({
        assignmentId: id,
        targetXmlPath: `${id}.xml`,
      })),
      fragmentBuffer: encodeConfigurationIndexFragments(fragments.get(workerIndex) ?? []),
    }
  })

  return {
    factory: pools.factory,
    runs(workerIndex: number): FullXmlSyncWorkerCommand[] {
      return [...pools.commands(workerIndex)]
    },
    executeIds(workerIndex: number): string[] {
      return pools.commands(workerIndex).flatMap((task) =>
        task.kind === "execute" ? task.assignments.map(({ id }) => id) : []
      )
    },
    created: pools.created,
    failWorker(workerIndex: number, error: Error) {
      failures.set(workerIndex, error)
    },
    diagnoseWorker(workerIndex: number, diagnostic: FullXmlSyncDiagnostic) {
      diagnostics.set(workerIndex, [diagnostic])
    },
    returnFragments(
      workerIndex: number,
      value: Parameters<typeof encodeConfigurationIndexFragments>[0]
    ) {
      fragments.set(workerIndex, value)
    },
    destroyCalls: () =>
      Array.from({ length: pools.created() }, (_, workerIndex) =>
        pools.destroyCalls(workerIndex)
      ),
  }
}
