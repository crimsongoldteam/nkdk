import fs from "node:fs"
import os from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { mockContextFromXML } from "../../tests/mockContext"
import { createMockWorkerThreadPoolFactory } from "../../tests/mockWorkerThreadPool"
import { encodeConfigurationIndexFragments } from "../configurationIndex/fragment"
import type { ProjectStateReadToken } from "../projectState/contracts"
import { createProjectStateFileUpdateBatch } from "../projectState/fileUpdate"
import { createOperationProfiler } from "../validation/profile"
import type { ImportAssignment, ImportDiagnostic, ImportWorkerCommand } from "./types"
import { serializeImportYaml, writeMainImportYaml } from "./writeOutput"
import {
  createXmlImportWorkerPool,
  createXmlImportWorkerPoolHandle,
  type XmlImportStateBatch,
} from "./workerPool"

const tempDirs: string[] = []

afterEach(() => {
  for (const dir of tempDirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true })
})

describe("XML import worker pool", () => {
  it("keeps the generic XML context free of component selection", () => {
    expect(mockContextFromXML().fromXML).not.toHaveProperty("componentKind")
  })

  it("sends one first-pass command per assignment with static round-robin ownership", async () => {
    const pools = createFakePools()
    const assignments = [assignment("one"), assignment("two"), assignment("three")]
    const pool = createXmlImportWorkerPool({ concurrency: 2, createWorkerPool: pools.factory })

    await pool.initialize({
      operationId: "op",
      context: mockContextFromXML(),
      outputDir: createTempDir("static"),
      componentKind: "configuration",
    })
    const first = await pool.runFirstPass(assignments)
    await pool.runSecondPass(readTokens(2))

    expect(pools.runs(0).map((task) => task.kind)).toEqual([
      "initialize", "firstPass", "firstPass", "beginSecondPass", "secondPass", "secondPass", "endSecondPass",
    ])
    expect(pools.runs(1).map((task) => task.kind)).toEqual([
      "initialize", "firstPass", "beginSecondPass", "secondPass", "endSecondPass",
    ])
    expect(pools.firstPassIds(0)).toEqual([assignments[0]?.id, assignments[2]?.id])
    expect(pools.firstPassIds(1)).toEqual([assignments[1]?.id])
    expect(pools.runs(0).filter((task) => task.kind === "firstPass").map((task) => task.finalize))
      .toEqual([false, true])
    expect(pools.runs(1).filter((task) => task.kind === "firstPass").map((task) => task.finalize))
      .toEqual([true])
    expect(first.validationContribution.objectIndexEntries.map((entry) => entry.canonical)).toEqual([
      "Catalog.one",
      "Catalog.three",
      "Catalog.two",
    ])
    expect(first.validationContribution.localDependencies.map((dependency) => dependency.canonical)).toEqual([
      "Catalog.one.Form.Основная",
      "Catalog.three.Form.Основная",
      "Catalog.two.Form.Основная",
    ])
    expect(first.files.map(({ targetProjectPath }) => targetProjectPath)).toEqual([
      "Справочник/one/Свойства.yaml",
      "Справочник/three/Свойства.yaml",
      "Справочник/two/Свойства.yaml",
    ])
    expect(first).not.toHaveProperty("localDependencies")

    await pool.close()
  })

  it("does not create physical workers for empty partitions", async () => {
    const pools = createFakePools()
    const pool = createXmlImportWorkerPool({ concurrency: 4, createWorkerPool: pools.factory })

    await pool.initialize({
      operationId: "op",
      context: mockContextFromXML(),
      outputDir: createTempDir("active"),
      componentKind: "configuration",
    })
    await pool.runFirstPass([assignment("only")])

    expect(pools.created()).toBe(1)
    await pool.close()
  })

  it("подтверждает state готового first-pass worker, пока другой worker заблокирован", async () => {
    const pools = createFakePools()
    const blocked = pools.blockFirstPassWorker(1)
    const pool = createXmlImportWorkerPool({ concurrency: 2, createWorkerPool: pools.factory })
    const acknowledged: string[] = []
    let notifyAcknowledged!: () => void
    const stateAcknowledged = new Promise<void>((resolve) => { notifyAcknowledged = resolve })
    const outputDir = createTempDir("stream-first")
    const readyPath = "Справочник/ready/Свойства.yaml"
    pools.writeRealFirstPassFile(0, readyPath)
    await pool.initialize({
      operationId: "stream-first",
      context: mockContextFromXML(),
      outputDir,
      componentKind: "configuration",
    })

    const running = pool.runFirstPass([assignment("ready"), assignment("blocked")], {
      async writeFirstPassState(batch: XmlImportStateBatch) {
        acknowledged.push(batch.indexContributions[0]!.projectPath)
        for (const final of batch.finalFileStateBatches) {
          structuredClone(final, { transfer: [final.hashBytes.buffer as ArrayBuffer] })
          expect(final.hashBytes.byteLength).toBe(0)
        }
        notifyAcknowledged()
      },
      async writeSecondPassState() {},
    } as never)
    await Promise.all([blocked.started, stateAcknowledged])

    expect(acknowledged).toEqual(["cf/Справочник/ready/Свойства.yaml"])
    expect(fs.existsSync(join(outputDir, readyPath))).toBe(true)
    blocked.release()
    const result = await running
    expect(result).not.toHaveProperty("indexContributions")
    expect(result).not.toHaveProperty("finalFileStateBatches")
    await pool.close()
  })

  it("ограничивает producer queue двумя неподтверждёнными state batches", async () => {
    const pools = createFakePools()
    const pool = createXmlImportWorkerPool({
      concurrency: 4,
      createWorkerPool: pools.factory,
      maxPendingStateBatches: 2,
    } as never)
    const releases: Array<() => void> = []
    let active = 0
    let maxActive = 0
    let started = 0
    await pool.initialize({
      operationId: "bounded",
      context: mockContextFromXML(),
      outputDir: createTempDir("bounded"),
      componentKind: "configuration",
    })

    const running = pool.runFirstPass(
      [assignment("one"), assignment("two"), assignment("three"), assignment("four")],
      {
        async writeFirstPassState() {
          active += 1
          started += 1
          maxActive = Math.max(maxActive, active)
          await new Promise<void>((resolve) => releases.push(resolve))
          active -= 1
        },
        async writeSecondPassState() {},
      } as never,
    )
    await pools.firstPassProduced(4)
    await new Promise<void>((resolve) => setImmediate(resolve))

    expect(started).toBe(2)
    expect(maxActive).toBe(2)
    while (releases.length > 0) releases.shift()!()
    await new Promise<void>((resolve) => setImmediate(resolve))
    while (releases.length > 0) releases.shift()!()
    await running
    await pool.close()
  })

  it("передаёт second-pass final state до завершения заблокированного worker", async () => {
    const pools = createFakePools()
    const pool = createXmlImportWorkerPool({ concurrency: 2, createWorkerPool: pools.factory })
    await pool.initialize({
      operationId: "stream-second",
      context: mockContextFromXML(),
      outputDir: createTempDir("stream-second"),
      componentKind: "configuration",
    })
    const sink = {
      async writeFirstPassState() {},
      async writeSecondPassState(batch: { finalFileStateBatches: Array<{ hashBytes: Uint8Array }> }) {
        acknowledged.push(batch.finalFileStateBatches[0]!.hashBytes.byteLength)
      },
    }
    await pool.runFirstPass([assignment("ready"), assignment("blocked")], sink as never)
    const blocked = pools.blockSecondPassWorker(1)
    const acknowledged: number[] = []

    const running = pool.runSecondPass(readTokens(2), sink as never)
    await blocked.started
    await new Promise<void>((resolve) => setImmediate(resolve))

    expect(acknowledged).toEqual([8])
    blocked.release()
    const result = await running
    expect(result).not.toHaveProperty("finalFileStateBatches")
    await pool.close()
  })

  it("passes cloneable component strings to the worker initialization command", async () => {
    const pools = createFakePools()
    const pool = createXmlImportWorkerPool({ concurrency: 1, createWorkerPool: pools.factory })
    const context = mockContextFromXML()

    await pool.initialize({
      operationId: "component",
      context,
      outputDir: createTempDir("component"),
      componentKind: "test-component",
      metadataItemAugmenter: "test-augmenter",
    })
    await pool.runFirstPass([assignment("component")])

    const initialize = pools.runs(0).find((command) => command.kind === "initialize")
    expect(initialize).toMatchObject({
      kind: "initialize",
      context: {
        fromXML: { componentKind: "test-component", metadataItemAugmenter: "test-augmenter" },
      },
    })
    expect(() => structuredClone(initialize)).not.toThrow()

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

    await pool.initialize({
      operationId: "op",
      context: mockContextFromXML(),
      outputDir: createTempDir("diagnostic"),
      componentKind: "configuration",
    })
    const result = await pool.runFirstPass([assignment("one"), assignment("two")])

    expect(result.diagnostics).toContainEqual(expect.objectContaining({ severity: "error" }))
    await expect(
      pool.runSecondPass(readTokens(2))
    ).rejects.toThrow("Первый проход import завершён с ошибками")
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

    await pool.initialize({
      operationId: "op",
      context: mockContextFromXML(),
      outputDir,
      componentKind: "configuration",
    })
    await expect(pool.runFirstPass([assignment("one"), assignment("two")])).rejects.toThrow("worker exited")

    expect(pools.destroyCalls()).toEqual([1, 1])
    expect(pools.firstPassIds(1)).toEqual(["two"])
    expect(fs.readFileSync(sentinelPath, "utf-8")).toBe("partial")
    await pool.close()
    expect(pools.destroyCalls()).toEqual([1, 1])
  })

  it("reuses physical workers across operation pools created by a handle", async () => {
    const pools = createFakePools()
    const handle = createXmlImportWorkerPoolHandle({ concurrency: 2, createWorkerPool: pools.factory })

    try {
      const firstOperation = handle.createOperationPool()
      await firstOperation.initialize({
        operationId: "one",
        context: mockContextFromXML(),
        outputDir: createTempDir("one"),
        componentKind: "configuration",
      })
      await firstOperation.runFirstPass([assignment("one-a"), assignment("one-b")])
      await firstOperation.runSecondPass(readTokens(2))
      await firstOperation.close()

      const secondOperation = handle.createOperationPool()
      await secondOperation.initialize({
        operationId: "two",
        context: mockContextFromXML(),
        outputDir: createTempDir("two"),
        componentKind: "configuration",
      })
      await secondOperation.runFirstPass([assignment("two-a"), assignment("two-b")])
      await secondOperation.runSecondPass(readTokens(2))
      await secondOperation.close()

      expect(pools.created()).toBe(2)
      expect(handle.size()).toBe(2)
      expect(pools.runs(0).map((task) => task.kind)).toEqual([
        "initialize",
        "firstPass",
        "beginSecondPass",
        "secondPass",
        "endSecondPass",
        "dispose",
        "initialize",
        "firstPass",
        "beginSecondPass",
        "secondPass",
        "endSecondPass",
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
  const failures = new Map<number, Error>()
  const diagnostics = new Map<number, ImportDiagnostic[]>()
  const firstPassBlocks = new Map<number, ReturnType<typeof gate>>()
  const secondPassBlocks = new Map<number, ReturnType<typeof gate>>()
  const initializedOutputDirs = new Map<number, string>()
  const realFirstPassFiles = new Map<number, string>()
  let producedFirstPass = 0
  const producedWaiters: Array<{ count: number; resolve: () => void }> = []
  const pools = createMockWorkerThreadPoolFactory<ImportWorkerCommand, unknown>(
    async (task, workerIndex) => {
      if (task.kind === "initialize") initializedOutputDirs.set(workerIndex, task.outputDir)
      if (task.kind === "firstPass") {
        const realFile = realFirstPassFiles.get(workerIndex)
        if (realFile !== undefined) {
          const outputDir = initializedOutputDirs.get(workerIndex)
          if (outputDir === undefined) throw new Error("Worker не инициализирован")
          const sourcePath = join(outputDir, realFile)
          await writeMainImportYaml({
            serialized: serializeImportYaml({
              output: { sourceKind: "worker", sourcePath, targetProjectPath: realFile },
              yaml: { Имя: "Готов" },
            }),
            profiler: createOperationProfiler({ operation: "test", scope: { scope: "main" } }),
          })
        }
        producedFirstPass += task.assignments.length
        for (const waiter of producedWaiters.splice(0)) {
          if (producedFirstPass >= waiter.count) waiter.resolve()
          else producedWaiters.push(waiter)
        }
        await firstPassBlocks.get(workerIndex)?.wait()
        const failure = failures.get(workerIndex)
        if (failure !== undefined) throw failure
        const indexContributions = task.assignments.map((item) => ({
          projectPath: `cf/${item.targetProjectPath}`,
          componentPath: "cf",
          resourceKind: "yaml" as const,
          yamlRole: "properties" as const,
          references: [], owners: [], fields: [], forms: [],
        }))
        const finalFileStateBatches = task.assignments.map((item) => fakeFinalBatch(`cf/${item.targetProjectPath}`))
        return {
          kind: "firstPassResult" as const,
          ownerFacts: [],
          validationContribution: {
            objectRecords: [],
            objectIndexEntries: task.assignments.map((item) => {
              const target = {
                kind: "object" as const,
                root: "Catalog" as const,
                objectName: item.itemName,
              }
              return {
                canonical: `Catalog.${item.itemName}`,
                target,
                result: {
                  ok: true as const,
                  filePath: item.targetProjectPath,
                },
              }
            }),
            memberIndexEntries: [],
            valueIndexEntries: [],
            pendingReferences: [],
            localDependencies: task.assignments.map((item) => ({
              sourceProjectPath: item.targetProjectPath,
              yamlPath: ["ОсновнаяФорма"],
              rulePath: [{ propertyKey: "defaultForm" }],
              kind: "metadataTarget" as const,
              canonical: `Catalog.${item.itemName}.Form.Основная`,
            })),
            logicalAddresses: [],
          },
          diagnostics: diagnostics.get(workerIndex) ?? [],
          files: task.assignments.map((item) => ({
            sourceKind: "worker" as const,
            sourcePath: join("/tmp/output", item.targetProjectPath),
            targetProjectPath: item.targetProjectPath,
          })),
          fragmentBuffer: encodeConfigurationIndexFragments(
            task.assignments.map((item) => ({
              targetProjectPath: item.targetProjectPath,
              entities: [
                {
                  logicalAddress: item.logicalAddress,
                  sourceProjectPath: item.targetProjectPath,
                  identities: { xmlName: item.itemName },
                },
              ],
            }))
          ),
          indexContributions,
          finalFileStateBatches,
        }
      }
      if (task.kind === "secondPass") {
        await secondPassBlocks.get(workerIndex)?.wait()
        return {
          kind: "secondPassResult" as const,
          diagnostics: [],
          warnings: [],
          files: [],
          finalFileStateBatches: [fakeFinalBatch(`cf/second-${workerIndex}.yaml`)],
        }
      }
      return undefined
    }
  )

  return {
    factory: pools.factory,
    runs(workerIndex: number): ImportWorkerCommand[] {
      return [...pools.commands(workerIndex)]
    },
    firstPassIds(workerIndex: number): string[] {
      return pools.commands(workerIndex).flatMap((task) =>
        task.kind === "firstPass" ? task.assignments.map((item) => item.id) : []
      )
    },
    created: pools.created,
    failWorker(workerIndex: number, error: Error): void {
      failures.set(workerIndex, error)
    },
    diagnoseWorker(workerIndex: number, diagnostic: ImportDiagnostic): void {
      diagnostics.set(workerIndex, [diagnostic])
    },
    blockFirstPassWorker(workerIndex: number) {
      const value = gate()
      firstPassBlocks.set(workerIndex, value)
      return value
    },
    blockSecondPassWorker(workerIndex: number) {
      const value = gate()
      secondPassBlocks.set(workerIndex, value)
      return value
    },
    writeRealFirstPassFile(workerIndex: number, targetProjectPath: string) {
      realFirstPassFiles.set(workerIndex, targetProjectPath)
    },
    firstPassProduced(count: number): Promise<void> {
      if (producedFirstPass >= count) return Promise.resolve()
      return new Promise<void>((resolve) => producedWaiters.push({ count, resolve }))
    },
    destroyCalls(): number[] {
      return Array.from({ length: pools.created() }, (_, workerIndex) =>
        pools.destroyCalls(workerIndex)
      )
    },
  }
}

function fakeFinalBatch(projectPath: string) {
  const update = {
    kind: "yaml" as const,
    projectPath,
    componentPath: "cf",
    resourceKind: "yaml" as const,
    yamlRole: "properties" as const,
    localValidation: { contributedFacts: true, diagnostics: [], schemaDiagnostics: [] },
    pendingReferences: [], pendingChecks: [], dependencies: [],
  }
  const encoded = createProjectStateFileUpdateBatch([{
    update: { ...update, references: [], owners: [], fields: [], forms: [] },
    hash: 1n,
  }])
  return { updates: [update], hashBytes: encoded.hashBytes }
}

function gate() {
  let release!: () => void
  let notifyStarted!: () => void
  const promise = new Promise<void>((resolve) => { release = resolve })
  const started = new Promise<void>((resolve) => { notifyStarted = resolve })
  return {
    started,
    release,
    async wait() {
      notifyStarted()
      await promise
    },
  }
}

function readTokens(count: number): ProjectStateReadToken[] {
  return Array.from({ length: count }, (_, index) => new Uint8Array([index + 1]) as ProjectStateReadToken)
}

function createTempDir(name: string): string {
  const dir = fs.mkdtempSync(join(os.tmpdir(), `nkdk-worker-pool-${name}-`))
  tempDirs.push(dir)
  return dir
}
