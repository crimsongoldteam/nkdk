import { describe, expect, it } from "vitest"
import { createMockWorkerThreadPoolFactory } from "../../tests/mockWorkerThreadPool"
import { encodeConfigurationBlockFragments } from "@nkdk/runtime"
import type { ConfigurationIndexBlockEntity } from "@nkdk/runtime"
import type {
  FullXmlSyncAssignment,
  FullXmlSyncDiagnostic,
  FullXmlSyncExecutionAssignment,
  FullXmlSyncWorkerCommand,
} from "./types"
import {
  createFullXmlSyncWorkerPool,
  normalizeFullXmlSyncConcurrency,
  type FullXmlSyncWorkerInitialization,
} from "./workerPool"
import { fullXmlSyncTestOutput } from "./testTopology"
import { createTestProjectStateReadToken } from "../projectState/tests/readToken"
import type { MetadataWorkerOperation } from "../workerPool/types"
import { createFullXmlSyncBinaryResult } from "./binaryResult"

describe("full XML sync worker pool", () => {
  const initialization = {
    componentPath: "cf",
    componentDir: "/project",
    outputTarget: { kind: "directory", outputDir: "/out" },
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
    targetIndex: targetIndex([]),
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

    expect(pools.runs(0).map(({ kind }) => kind)).toEqual(["initialize", "executeBatch", "finishExecution"])
    expect(pools.runs(1).map(({ kind }) => kind)).toEqual(["initialize", "executeBatch", "finishExecution"])
    expect(pools.executeIds(0)).toEqual(["one", "three"])
    expect(pools.executeIds(1)).toEqual(["two"])
    await expect(pool.execute(assignments)).rejects.toThrow("уже было запущено")
    await pool.close()
    expect(pools.runs(0).map(({ kind }) => kind)).toEqual(["initialize", "executeBatch", "finishExecution", "dispose"])
    expect(pools.runs(1).map(({ kind }) => kind)).toEqual(["initialize", "executeBatch", "finishExecution", "dispose"])
  })

  it("передаёт назначения пачками 256 и завершает worker без накопленного результата", async () => {
    const pools = createFakePools()
    const assignments = Array.from({ length: 257 }, (_unused, index) => assignment(String(index)))
    const pool = createFullXmlSyncWorkerPool({ concurrency: 1, createWorkerPool: pools.factory })

    await pool.initialize(initialization)
    await pool.execute(assignments)

    expect(pools.runs(0).map(({ kind }) => kind)).toEqual([
      "initialize", "executeBatch", "executeBatch", "finishExecution",
    ])
    expect(pools.executeBatchSizes(0)).toEqual([256, 1])
    await pool.close()
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
    expect(pools.runs(0).map(({ kind }) => kind)).toEqual(["initialize", "executeBatch", "finishExecution"])
    await pool.close()
    expect(pools.destroyCalls()).toEqual([1])
  })

  it("один раз связывает назначения с диапазонами target index до передачи worker", async () => {
    const pools = createFakePools()
    const pool = createFullXmlSyncWorkerPool({ concurrency: 1, createWorkerPool: pools.factory })
    await pool.initialize({
      ...initialization,
      targetIndex: targetIndex([{ logicalAddress: "Справочник.one" }]),
    })

    await pool.execute([assignment("one"), assignment("new")])

    expect(pools.executionAssignments(0).map(({ configurationIndexSources }) =>
      configurationIndexSources
    )).toEqual([
      { targetProjectPaths: ["one.yaml"], baseProjectPaths: [] },
      { targetProjectPaths: ["new.yaml"], baseProjectPaths: [] },
    ])
    await pool.close()
  })

  it("выполняет синхронизацию через универсальную операцию без отдельного пула", async () => {
    const commands: FullXmlSyncWorkerCommand[] = []
    const outcomes: string[] = []
    const operation: MetadataWorkerOperation = {
      id: "full-sync",
      concurrency: 1,
      async run(_workerIndex, command) {
        if (command.kind !== "fullSync") throw new Error("Ожидалась команда fullSync")
        commands.push(command.command)
        return {
          kind: "fullSyncResult",
          result: command.command.kind === "executeBatch" ? executionResult() : undefined,
        }
      },
      async finish(outcome) { outcomes.push(outcome) },
    }
    const pool = createFullXmlSyncWorkerPool({
      concurrency: 1,
      operation,
      createWorkerPool() { throw new Error("Не должен создаваться отдельный пул") },
    })
    const { projectStateReadTokens: _tokens, ...universalInitialization } = initialization

    await pool.initialize(universalInitialization)
    await pool.execute([assignment("one")])
    await pool.close()

    expect(commands.map(({ kind }) => kind)).toEqual(["initialize", "executeBatch", "finishExecution", "dispose"])
    expect(commands[0]).not.toHaveProperty("projectStateReadToken")
    expect(outcomes).toEqual(["success"])
  })

  it("merges execution results from workers", async () => {
    const pools = createFakePools()
    pools.returnFragments(0, [fragment("one.yaml")])
    pools.returnFragments(1, [fragment("two.yaml", {
      logicalAddress: "Справочник.two",
      uuid: "11111111-1111-4111-8111-111111111111",
    })])
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
    const streamed: unknown[] = []
    const result = await pool.execute([assignment("one"), assignment("two")], {
      async onBatch(batch) { streamed.push(...batch.configurationFragments) },
    })

    expect(Array.isArray(result.diagnostics)).toBe(false)
    expect([...result.diagnostics]).toEqual([expect.objectContaining({ severity: "error", assignmentId: "two" })])
    expect(result.expectedOutputs.count).toBe(2)
    expect(streamed).toHaveLength(2)
    await pool.close()
  })

  it("передаёт XML-документы обработчику пачек и не включает их в итог", async () => {
    const pools = createMockWorkerThreadPoolFactory<FullXmlSyncWorkerCommand, unknown>(async (task) => {
      if (task.kind !== "executeBatch") return undefined
      return createFullXmlSyncBinaryResult({
        diagnostics: [],
        warnings: [],
        writtenFiles: [],
        expectedOutputs: [],
        generatedDocuments: task.assignments.map(({ id }) => ({
          assignmentId: id,
          declarationId: "test-document",
          targetXmlPath: `${id}.xml`,
          content: new TextEncoder().encode(`<item>${id}</item>`),
        })),
        configurationFragments: [],
      })
    })
    const pool = createFullXmlSyncWorkerPool({ concurrency: 2, createWorkerPool: pools.factory })
    const batches: string[][] = []
    await pool.initialize({
      ...initialization,
      outputTarget: {
        kind: "memory",
        documentIdsByAssignment: { one: ["test-document"], two: ["test-document"] },
      },
    })

    const result = await pool.execute([assignment("one"), assignment("two")], {
      maxBufferedBatches: 1,
      async onBatch(batch) {
        batches.push(batch.generatedDocuments.map(({ content }) => new TextDecoder().decode(content)))
      },
    })

    expect(batches).toEqual([["<item>one</item>"], ["<item>two</item>"]])
    expect(result.expectedOutputs.count).toBe(0)
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
          if (command.kind === "executeBatch") throw primary
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
    expect(commands).toEqual(["initialize", "executeBatch", "dispose"])
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
          if (command.kind !== "executeBatch") return undefined
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

function targetIndex(_entities: readonly ConfigurationIndexBlockEntity[]) {
  return {
    dataPath: "/project/.nkdk/components/cf/configuration-index.lmdb",
    lockPath: "/project/.nkdk/components/cf/configuration-index.lmdb-lock",
    schemaVersion: 1,
  } as const
}

function fragment(targetProjectPath: string, ...entities: readonly ConfigurationIndexBlockEntity[]) {
  return { targetProjectPath, entities }
}

function executionResult() {
  return createFullXmlSyncBinaryResult({
    diagnostics: [],
    warnings: [],
    writtenFiles: [],
    expectedOutputs: [],
    configurationFragments: [],
  })
}

function createFakePools() {
  const failures = new Map<number, Error>()
  const diagnostics = new Map<number, FullXmlSyncDiagnostic[]>()
  const fragments = new Map<number, Parameters<typeof encodeConfigurationBlockFragments>[0]>()
  const pools = createMockWorkerThreadPoolFactory<
    FullXmlSyncWorkerCommand,
    unknown
  >(async (task, workerIndex) => {
    if (task.kind !== "executeBatch") return undefined
    const failure = failures.get(workerIndex)
    if (failure !== undefined) throw failure
    return createFullXmlSyncBinaryResult({
      diagnostics: diagnostics.get(workerIndex) ?? [],
      warnings: [],
      writtenFiles: [],
      expectedOutputs: task.assignments.map(({ id }) => ({
        assignmentId: id,
        targetXmlPath: `${id}.xml`,
      })),
      configurationFragments: fragments.get(workerIndex) ?? [],
    })
  })

  return {
    factory: pools.factory,
    runs(workerIndex: number): FullXmlSyncWorkerCommand[] {
      return [...pools.commands(workerIndex)]
    },
    executeIds(workerIndex: number): string[] {
      return pools.commands(workerIndex).flatMap((task) =>
        task.kind === "executeBatch" ? task.assignments.map(({ id }) => id) : []
      )
    },
    executeBatchSizes(workerIndex: number): number[] {
      return pools.commands(workerIndex).flatMap((task) => task.kind === "executeBatch" ? [task.assignments.length] : [])
    },
    executionAssignments(workerIndex: number): FullXmlSyncExecutionAssignment[] {
      return pools.commands(workerIndex).flatMap((task) =>
        task.kind === "executeBatch" ? [...task.assignments] : []
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
      value: Parameters<typeof encodeConfigurationBlockFragments>[0]
    ) {
      fragments.set(workerIndex, value)
    },
    destroyCalls: () =>
      Array.from({ length: pools.created() }, (_, workerIndex) =>
        pools.destroyCalls(workerIndex)
      ),
  }
}
