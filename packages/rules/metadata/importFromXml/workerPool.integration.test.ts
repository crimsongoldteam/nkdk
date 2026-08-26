import fs from "node:fs"
import os from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { mockContextFromXML } from "../../tests/mockContext"
import { createMockWorkerThreadPoolFactory } from "../../tests/mockWorkerThreadPool"
import { decodeConfigurationBlockFragments } from "@nkdk/runtime"
import type { ProjectStateReadToken } from "../projectState/contracts"
import type { MetadataWorkerOperation } from "../workerPool/types"
import { createTestProjectStateReadToken } from "../projectState/tests/readToken"
import { createProjectStateFileUpdateBatch } from "../projectState/fileUpdate"
import { createProjectStateFragmentWriter, openProjectStateFragment } from "../projectState/binary/fragment"
import { createOperationProfiler } from "../validation/profile"
import type { ImportAssignment, ImportDiagnostic, ImportWorkerCommand } from "./types"
import { serializeImportYaml, writeMainImportYaml } from "./writeOutput"
import { createImportBinaryResult } from "./binaryResult"
import {
  createXmlImportWorkerPool,
  createXmlImportWorkerPoolHandle,
  type XmlImportStateBatch,
} from "./workerPool"
import type { XmlComponentExportProfile } from "../project/xmlReconstructionProfile"
import { configurationIndexStoreDescriptor } from "../configurationIndex"

const tempDirs: string[] = []

afterEach(() => {
  for (const dir of tempDirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true })
})

describe("XML import worker pool", () => {
  it("keeps the generic XML context free of component selection", () => {
    expect(mockContextFromXML().fromXML).not.toHaveProperty("componentKind")
  })

  it("отправляет 257 назначений пачками 256 и 1 с одним завершением первого прохода", async () => {
    const pools = createFakePools()
    const assignments = Array.from({ length: 257 }, (_unused, index) => assignment(String(index)))
    const pool = createXmlImportWorkerPool({ concurrency: 1, createWorkerPool: pools.factory })

    await pool.initialize({
      operationId: "op",
      context: mockContextFromXML(),
      outputDir: createTempDir("static"),
      componentKind: "configuration",
    })
    const first = await pool.runFirstPass(assignments)
    expect(pools.runs(0).map((task) => task.kind)).toEqual([
      "initialize", "firstPassBatch", "firstPassBatch", "finishFirstPass",
    ])
    expect(pools.firstPassBatchSizes(0)).toEqual([256, 1])
    expect(first.files.count).toBe(257)
    expect(Array.isArray(first.files)).toBe(false)
    expect(Array.isArray(first.diagnostics)).toBe(false)
    expect(first).not.toHaveProperty("ownerFacts")
    expect(first).not.toHaveProperty("validationContribution")

    await pool.runSecondPass(readTokens(1), exportProfileForTests())
    expect(pools.secondPassBatchSizes(0)).toEqual([256, 1])

    await pool.runThirdPass(readTokens(1))
    expect(pools.thirdPassBatchSizes(0)).toEqual([256, 1])

    await pool.close()
  })

  it("запрещает третий проход до второго и выполняет его после смыслового барьера", async () => {
    const pools = createFakePools()
    const pool = createXmlImportWorkerPool({ concurrency: 1, createWorkerPool: pools.factory })

    await pool.initialize({
      operationId: "three-pass-order",
      context: mockContextFromXML(),
      outputDir: createTempDir("three-pass-order"),
      componentKind: "configuration",
    })
    await pool.runFirstPass([assignment("one")])

    await expect(pool.runThirdPass(readTokens(1))).rejects.toThrow("Второй проход import не завершён")

    await pool.runSecondPass(readTokens(1), exportProfileForTests())
    await pool.runThirdPass(readTokens(1))

    expect(pools.runs(0).map(({ kind }) => kind)).toEqual([
      "initialize",
      "firstPassBatch",
      "finishFirstPass",
      "beginSecondPass",
      "secondPassBatch",
      "finishSecondPass",
      "beginThirdPass",
      "thirdPassBatch",
      "finishThirdPass",
    ])
    await pool.close()
  })

  it("передаёт каждому worker полный состав конфигурации для контрольного экспорта", async () => {
    const pools = createFakePools()
    const pool = createXmlImportWorkerPool({ concurrency: 2, createWorkerPool: pools.factory })
    const assignments = [assignment("first"), assignment("second")]
    const exportProfile = exportProfileForTests()

    await pool.initialize({
      operationId: "composition",
      context: mockContextFromXML(),
      outputDir: createTempDir("composition"),
      componentKind: "configuration",
    })
    await pool.runFirstPass(assignments)
    await pool.runSecondPass(readTokens(2), exportProfile)

    expect(structuredClone(exportProfile)).toEqual(exportProfile)

    for (const workerIndex of [0, 1]) {
      expect(pools.runs(workerIndex).find(({ kind }) => kind === "beginSecondPass")).toMatchObject({
        exportProfile,
        composition: assignments.map(({ targetProjectPath, itemType, itemName, logicalAddress, role }) => ({
          sourceProjectPath: targetProjectPath,
          itemType,
          itemName,
          logicalAddress,
          assignmentRole: role,
        })),
      })
      expect(pools.runs(workerIndex).find(({ kind }) => kind === "secondPassBatch"))
        .not.toHaveProperty("exportProfile")
    }

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

  it("передаёт освободившемуся worker следующее тяжёлое задание второго прохода", async () => {
    const pools = createFakePools()
    pools.prepareRecords({ a: 100, b: 90, c: 80, d: 70 })
    const blocked = pools.blockSecondPassAssignment("b")
    const pool = createXmlImportWorkerPool({ concurrency: 2, createWorkerPool: pools.factory })

    await pool.initialize({
      operationId: "dynamic-second-pass",
      context: mockContextFromXML(),
      outputDir: createTempDir("dynamic-second-pass"),
      componentKind: "configuration",
    })
    await pool.runFirstPass([assignment("a"), assignment("b"), assignment("c"), assignment("d")])
    const running = pool.runSecondPass(readTokens(2), exportProfileForTests())

    await Promise.all([blocked.started, pools.secondPassStarted("c"), pools.secondPassStarted("d")])
    expect(pools.secondPassWorker("c")).toBe(pools.secondPassWorker("a"))
    expect(pools.secondPassWorker("d")).toBe(pools.secondPassWorker("a"))
    expect(pools.secondPassWorker("c")).not.toBe(pools.secondPassWorker("b"))
    expect(pools.firstPassIds(pools.secondPassWorker("d")!)).not.toContain("d")

    blocked.release()
    await running
    await pool.close()
  })

  it("освобождает подготовленную запись только после успешной записи третьего прохода", async () => {
    const pools = createFakePools()
    pools.prepareRecords({ one: 10 })
    const pool = createXmlImportWorkerPool({ concurrency: 1, createWorkerPool: pools.factory })
    const released: string[] = []
    const sink = {
      async writeFirstPassState() {},
      async writeSecondPassState() {},
      async writeThirdPassState() {},
      async releasePrepared(assignmentIds: readonly string[]) { released.push(...assignmentIds) },
    }

    await pool.initialize({
      operationId: "prepared-release",
      context: mockContextFromXML(),
      outputDir: createTempDir("prepared-release"),
      componentKind: "configuration",
    })
    await pool.runFirstPass([assignment("one")], sink)
    await pool.runSecondPass(readTokens(1), exportProfileForTests(), sink)
    expect(released).toEqual([])

    await pool.runThirdPass(readTokens(1), sink)
    expect(released).toEqual(["one"])
    await pool.close()
  })

  it("выполняет import через универсальную операцию и не создаёт отдельный пул", async () => {
    const commands: ImportWorkerCommand[] = []
    const outcomes: string[] = []
    const operation: MetadataWorkerOperation = {
      id: "universal-import",
      concurrency: 1,
      async run(_workerIndex, command) {
        if (command.kind !== "import") throw new Error("Ожидалась команда import")
        commands.push(command.command)
        const result = command.command.kind === "firstPassBatch"
          ? createImportBinaryResult({ diagnostics: [], files: [] })
          : undefined
        return { kind: "importResult", result }
      },
      async finish(outcome) { outcomes.push(outcome) },
    }
    const pool = createXmlImportWorkerPool({
      concurrency: 1,
      operation,
      createWorkerPool() { throw new Error("Не должен создаваться отдельный пул") },
    })

    await pool.initialize({
      operationId: "universal-import",
      context: mockContextFromXML(),
      outputDir: createTempDir("universal"),
      componentKind: "configuration",
    })
    await pool.runFirstPass([assignment("one")])
    await pool.close()

    expect(commands.map(({ kind }) => kind)).toEqual([
      "initialize", "firstPassBatch", "finishFirstPass", "dispose",
    ])
    expect(outcomes).toEqual(["success"])
  })

  it("подтверждает state готового first-pass worker, пока другой worker заблокирован", async () => {
    const pools = createFakePools()
    const blocked = pools.blockFirstPassWorker(1)
    const pool = createXmlImportWorkerPool({ concurrency: 2, createWorkerPool: pools.factory })
    const acknowledged: string[] = []
    const fragments: Array<string | undefined> = []
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
        fragments.push(configurationProjectPaths(batch)[0])
        acknowledged.push(fragmentProjectPath(batch))
        const buffers = Object.values(batch.stateFragment!.buffers)
        structuredClone(batch.stateFragment, { transfer: buffers })
        expect(buffers.every((buffer) => buffer.byteLength === 0)).toBe(true)
        notifyAcknowledged()
      },
      async writeSecondPassState() {},
    } as never)
    await Promise.all([blocked.started, stateAcknowledged])

    expect(acknowledged).toEqual(["cf/Справочник/ready/Свойства.yaml"])
    expect(fragments).toEqual([readyPath])
    expect(fs.existsSync(join(outputDir, readyPath))).toBe(true)
    blocked.release()
    const result = await running
    expect(result).not.toHaveProperty("indexBatches")
    expect(result).not.toHaveProperty("finalStateBatches")
    expect(result).not.toHaveProperty("fragmentData")
    await pool.close()
  })

  it("публикует общий fragment только после завершения последнего assignment линии", async () => {
    const pools = createFakePools()
    const blocked = pools.blockFirstPassAssignment("last")
    const pool = createXmlImportWorkerPool({ concurrency: 1, createWorkerPool: pools.factory })
    const received: string[] = []
    await pool.initialize({
      operationId: "stream-fragments",
      context: mockContextFromXML(),
      outputDir: createTempDir("stream-fragments"),
      componentKind: "configuration",
    })

    const running = pool.runFirstPass([assignment("first"), assignment("last")], {
      async writeFirstPassState(batch: XmlImportStateBatch) {
        received.push(...configurationProjectPaths(batch))
      },
      async writeSecondPassState() {},
    })
    await blocked.started

    expect(received).toEqual([])
    blocked.release()
    const result = await running
    expect(received).toEqual([
      "Справочник/first/Свойства.yaml",
      "Справочник/last/Свойства.yaml",
    ])
    expect(result).not.toHaveProperty("fragmentData")
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
        async writeFirstPassState(batch: XmlImportStateBatch) {
          expect(batch.configurationFragmentBuffer).toBeDefined()
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

  it("ждёт все active first-pass sinks после primary failure и не выдаёт новые пачки", async () => {
    const pools = createFakePools()
    const pool = createXmlImportWorkerPool({ concurrency: 2, createWorkerPool: pools.factory })
    const primary = new Error("first sink failed")
    const secondSink = gate()
    const bothStarted = gate()
    const started = { value: 0 }
    await pool.initialize({
      operationId: "first-sink-failure",
      context: mockContextFromXML(),
      outputDir: createTempDir("first-sink-failure"),
      componentKind: "configuration",
    })

    const running = pool.runFirstPass([
      assignment("one"), assignment("two"), assignment("three"), assignment("four"),
    ], {
      async writeFirstPassState(batch) {
        await waitForBothSinks(started, bothStarted)
        if (fragmentProjectPath(batch).includes("one")) throw primary
        secondSink.start()
        await secondSink.wait()
      },
      async writeSecondPassState() {},
    })
    const outcome = running.then(
      () => ({ status: "fulfilled" as const }),
      (error: unknown) => ({ status: "rejected" as const, error }),
    )
    await Promise.all([bothStarted.started, secondSink.started])
    await new Promise<void>((resolve) => setImmediate(resolve))

    expect(await promiseStatus(outcome)).toBe("pending")
    secondSink.release()
    const settled = await outcome

    expect(settled).toEqual({ status: "rejected", error: primary })
    expect(pools.firstPassIds(0)).toEqual(["one", "three"])
    expect(pools.firstPassIds(1)).toEqual(["two", "four"])
    expect(pools.destroyCalls()).toEqual([1, 1])
    await pool.close()
  })

  it("сохраняет first-pass primary и добавляет ошибку второго active sink", async () => {
    const pools = createFakePools()
    const pool = createXmlImportWorkerPool({ concurrency: 2, createWorkerPool: pools.factory })
    const primary = new Error("first sink failed")
    const secondary = new Error("second sink failed")
    const bothStarted = gate()
    const releaseSecondary = gate()
    const started = { value: 0 }
    await pool.initialize({
      operationId: "first-sink-aggregate",
      context: mockContextFromXML(),
      outputDir: createTempDir("first-sink-aggregate"),
      componentKind: "configuration",
    })

    const running = pool.runFirstPass([assignment("one"), assignment("two")], {
      async writeFirstPassState(batch) {
        await waitForBothSinks(started, bothStarted)
        if (fragmentProjectPath(batch).includes("one")) throw primary
        releaseSecondary.start()
        await releaseSecondary.wait()
        throw secondary
      },
      async writeSecondPassState() {},
    })
    await expectPendingAggregate(
      running,
      Promise.all([bothStarted.started, releaseSecondary.started]),
      releaseSecondary.release,
      [primary, secondary],
    )
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
      async writeSecondPassState(batch: XmlImportStateBatch) {
        acknowledged.push(Object.values(batch.stateFragment!.buffers).reduce((sum, buffer) => sum + buffer.byteLength, 0))
      },
    }
    await pool.runFirstPass([assignment("ready"), assignment("blocked")], sink as never)
    const blocked = pools.blockSecondPassWorker(1)
    const acknowledged: number[] = []

    const running = pool.runSecondPass(readTokens(2), exportProfileForTests(), sink as never)
    await blocked.started
    await new Promise<void>((resolve) => setImmediate(resolve))

    expect(acknowledged[0]).toBeGreaterThan(8)
    blocked.release()
    const result = await running
    expect(result).not.toHaveProperty("finalStateBatches")
    await pool.close()
  })

  it("ждёт все active second-pass sinks и агрегирует их ошибки", async () => {
    const pools = createFakePools()
    const pool = createXmlImportWorkerPool({ concurrency: 2, createWorkerPool: pools.factory })
    const primary = new Error("first second-pass sink failed")
    const secondary = new Error("second second-pass sink failed")
    const bothStarted = gate()
    const releaseSecondary = gate()
    let started = 0
    await pool.initialize({
      operationId: "second-sink-failure",
      context: mockContextFromXML(),
      outputDir: createTempDir("second-sink-failure"),
      componentKind: "configuration",
    })
    await pool.runFirstPass([assignment("one"), assignment("two")])

    const running = pool.runSecondPass(readTokens(2), exportProfileForTests(), {
      async writeFirstPassState() {},
      async writeSecondPassState(batch) {
        started += 1
        if (started === 2) bothStarted.start()
        await bothStarted.started
        const projectPath = fragmentProjectPath(batch)
        if (projectPath.includes("second-0")) throw primary
        releaseSecondary.start()
        await releaseSecondary.wait()
        throw secondary
      },
    })
    await expectPendingAggregate(
      running,
      Promise.all([bothStarted.started, releaseSecondary.started]),
      releaseSecondary.release,
      [primary, secondary],
    )
    expect(pools.destroyCalls()).toEqual([1, 1])
    await pool.close()
  })

  it("passes cloneable component strings to the worker initialization command", async () => {
    const pools = createFakePools()
    const pool = createXmlImportWorkerPool({ concurrency: 1, createWorkerPool: pools.factory })
    const context = mockContextFromXML()
    const configurationIndex = configurationIndexStoreDescriptor("/project", { kind: "configurationExtension", name: "Расширение" })
    const baseConfigurationIndex = configurationIndexStoreDescriptor("/project", { kind: "configuration" })

    await pool.initialize({
      operationId: "component",
      context,
      outputDir: createTempDir("component"),
      componentKind: "test-component",
      metadataItemAugmenter: "test-augmenter",
      configurationIndex,
      baseConfigurationIndex,
    })
    await pool.runFirstPass([assignment("component")])

    const initialize = pools.runs(0).find((command) => command.kind === "initialize")
    expect(initialize).toMatchObject({
      kind: "initialize",
      context: {
        fromXML: { componentKind: "test-component", metadataItemAugmenter: "test-augmenter" },
      },
      configurationIndex,
      baseConfigurationIndex,
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

    expect([...result.diagnostics]).toContainEqual(expect.objectContaining({ severity: "error" }))
    await expect(
      pool.runSecondPass(readTokens(2), exportProfileForTests())
    ).rejects.toThrow("Первый проход import завершён с ошибками")
    expect(pools.runs(0).map((task) => task.kind)).toEqual([
      "initialize", "firstPassBatch", "finishFirstPass",
    ])
    expect(pools.runs(1).map((task) => task.kind)).toEqual([
      "initialize", "firstPassBatch", "finishFirstPass",
    ])

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

  it("ждёт settlement всех worker destroy и агрегирует cleanup failures", async () => {
    const primary = new Error("worker failed")
    const firstCleanup = new Error("first destroy failed")
    const secondCleanup = new Error("second destroy failed")
    const secondDestroy = gate()
    let workerIndex = 0
    const pool = createXmlImportWorkerPool({
      concurrency: 2,
      createWorkerPool: () => {
        const current = workerIndex++
        return {
          async run(command) {
            if (command.kind === "firstPassBatch") throw primary
            return undefined
          },
          async destroy() {
            if (current === 0) throw firstCleanup
            secondDestroy.start()
            await secondDestroy.wait()
            throw secondCleanup
          },
        }
      },
    })
    await pool.initialize({
      operationId: "destroy-settlement",
      context: mockContextFromXML(),
      outputDir: createTempDir("destroy-settlement"),
      componentKind: "configuration",
    })

    const outcome = pool.runFirstPass([assignment("one"), assignment("two")]).catch((error: unknown) => error)
    await secondDestroy.started
    await new Promise<void>((resolve) => setImmediate(resolve))

    expect(await promiseStatus(outcome)).toBe("pending")
    secondDestroy.release()
    const failure = await outcome

    expect(failure).toBeInstanceOf(AggregateError)
    expect((failure as AggregateError).errors).toEqual([primary, firstCleanup, secondCleanup])
    await pool.close()
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
      await firstOperation.runSecondPass(readTokens(2), exportProfileForTests())
      await firstOperation.close()

      const secondOperation = handle.createOperationPool()
      await secondOperation.initialize({
        operationId: "two",
        context: mockContextFromXML(),
        outputDir: createTempDir("two"),
        componentKind: "configuration",
      })
      await secondOperation.runFirstPass([assignment("two-a"), assignment("two-b")])
      await secondOperation.runSecondPass(readTokens(2), exportProfileForTests())
      await secondOperation.close()

      expect(pools.created()).toBe(2)
      expect(handle.size()).toBe(2)
      expect(pools.runs(0).map((task) => task.kind)).toEqual([
        "initialize",
        "firstPassBatch",
        "finishFirstPass",
        "beginSecondPass",
        "secondPassBatch",
        "finishSecondPass",
        "dispose",
        "initialize",
        "firstPassBatch",
        "finishFirstPass",
        "beginSecondPass",
        "secondPassBatch",
        "finishSecondPass",
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

function exportProfileForTests(): XmlComponentExportProfile {
  return {
    componentKind: "configurationExtension",
    adoptedUuids: { "Справочник.Товары": "11111111-1111-4111-8111-111111111111" },
    xmlDefaultVariantByLogicalAddress: {
      Конфигурация: "adopted",
      "Справочник.Товары": "adopted",
    },
    typeDescriptionXMLNameByType: { AnyIBRef: "AnyRef" },
  }
}

function assignment(id: string, overrides: Partial<ImportAssignment> = {}): ImportAssignment {
  return {
    id,
    topologyAddress: { nodeId: "catalog", values: { ownerName: id } },
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
  const firstPassAssignmentBlocks = new Map<string, ReturnType<typeof gate>>()
  const secondPassBlocks = new Map<number, ReturnType<typeof gate>>()
  const secondPassAssignmentBlocks = new Map<string, ReturnType<typeof gate>>()
  const secondPassAssignmentWorkers = new Map<string, number>()
  const secondPassAssignmentStarted = new Map<string, ReturnType<typeof gate>>()
  const preparedWeights = new Map<string, number>()
  const initializedOutputDirs = new Map<number, string>()
  const realFirstPassFiles = new Map<number, string>()
  let producedFirstPass = 0
  const producedWaiters: Array<{ count: number; resolve: () => void }> = []
  const pools = createMockWorkerThreadPoolFactory<ImportWorkerCommand, unknown>(
    async (task, workerIndex) => {
      if (task.kind === "initialize") initializedOutputDirs.set(workerIndex, task.outputDir)
      if (task.kind === "firstPassBatch") {
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
        for (const item of task.assignments) {
          producedFirstPass += 1
          for (const waiter of producedWaiters.splice(0)) {
            if (producedFirstPass >= waiter.count) waiter.resolve()
            else producedWaiters.push(waiter)
          }
          await firstPassAssignmentBlocks.get(item.id)?.wait()
        }
        await firstPassBlocks.get(workerIndex)?.wait()
        const failure = failures.get(workerIndex)
        if (failure !== undefined) throw failure
        const indexContributions = task.assignments.map((item) => ({
          projectPath: `cf/${item.targetProjectPath}`,
          componentPath: "cf",
          resourceKind: "yaml" as const,
          yamlRole: "properties" as const,
          targets: [], owners: [], fields: [], forms: [],
        }))
        const finalFileStateBatches = task.assignments.map((item) => fakeFinalBatch(`cf/${item.targetProjectPath}`))
        return createImportBinaryResult({
          diagnostics: diagnostics.get(workerIndex) ?? [],
          files: task.assignments.map((item) => ({
            sourceKind: "worker" as const,
            sourcePath: join("/tmp/output", item.targetProjectPath),
            targetProjectPath: item.targetProjectPath,
          })),
          configurationFragments: task.assignments.map((item) => ({
              targetProjectPath: item.targetProjectPath,
              entities: [
                {
                  logicalAddress: item.logicalAddress,
                  xmlId: item.itemName,
                },
              ],
            })),
          stateFragment: createImportFragment(indexContributions, finalFileStateBatches),
          preparedRecords: task.assignments.flatMap((item) => {
            const weight = preparedWeights.get(item.id)
            return weight === undefined
              ? []
              : [{ locator: { assignmentId: item.id, weight }, bytes: Uint8Array.of(1) }]
          }),
        })
      }
      if (task.kind === "finishFirstPass") {
        return undefined
      }
      if (task.kind === "secondPassBatch") {
        await secondPassBlocks.get(workerIndex)?.wait()
        for (const assignmentId of task.assignmentIds) {
          secondPassAssignmentWorkers.set(assignmentId, workerIndex)
          secondPassAssignmentStarted.get(assignmentId)?.start()
          await secondPassAssignmentBlocks.get(assignmentId)?.wait()
        }
        return createImportBinaryResult({
          diagnostics: [], warnings: [], files: [],
          stateFragment: createImportFragment([], [fakeFinalBatch(`cf/second-${workerIndex}.yaml`)]),
        })
      }
      if (task.kind === "finishSecondPass") {
        return undefined
      }
      if (task.kind === "thirdPassBatch") {
        return createImportBinaryResult({ diagnostics: [], warnings: [], files: [] })
      }
      if (task.kind === "finishThirdPass") {
        return undefined
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
        task.kind === "firstPassBatch" ? task.assignments.map((item) => item.id) : []
      )
    },
    firstPassBatchSizes(workerIndex: number): number[] {
      return pools.commands(workerIndex).flatMap((task) =>
        task.kind === "firstPassBatch" ? [task.assignments.length] : []
      )
    },
    secondPassBatchSizes(workerIndex: number): number[] {
      return pools.commands(workerIndex).flatMap((task) =>
        task.kind === "secondPassBatch" ? [task.assignmentIds.length] : []
      )
    },
    thirdPassBatchSizes(workerIndex: number): number[] {
      return pools.commands(workerIndex).flatMap((task) =>
        task.kind === "thirdPassBatch" ? [task.assignmentIds.length] : []
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
    blockFirstPassAssignment(assignmentId: string) {
      const value = gate()
      firstPassAssignmentBlocks.set(assignmentId, value)
      return value
    },
    blockSecondPassWorker(workerIndex: number) {
      const value = gate()
      secondPassBlocks.set(workerIndex, value)
      return value
    },
    blockSecondPassAssignment(assignmentId: string) {
      const value = gate()
      secondPassAssignmentBlocks.set(assignmentId, value)
      secondPassAssignmentStarted.set(assignmentId, value)
      return value
    },
    secondPassStarted(assignmentId: string): Promise<void> {
      let value = secondPassAssignmentStarted.get(assignmentId)
      if (value === undefined) {
        value = gate()
        secondPassAssignmentStarted.set(assignmentId, value)
      }
      if (secondPassAssignmentWorkers.has(assignmentId)) value.start()
      return value.started
    },
    secondPassWorker(assignmentId: string): number | undefined {
      return secondPassAssignmentWorkers.get(assignmentId)
    },
    prepareRecords(weights: Readonly<Record<string, number>>): void {
      for (const [assignmentId, weight] of Object.entries(weights)) preparedWeights.set(assignmentId, weight)
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

function createImportFragment(
  indexContributions: Parameters<ReturnType<typeof createProjectStateFragmentWriter>["appendImportIndex"]>[0][],
  finalBatches: Parameters<ReturnType<typeof createProjectStateFragmentWriter>["appendImportFinal"]>[0][],
) {
  const writer = createProjectStateFragmentWriter()
  for (const contribution of indexContributions) writer.appendImportIndex(contribution)
  for (const batch of finalBatches) writer.appendImportFinal(batch)
  return writer.finish()
}

function fragmentProjectPath(batch: XmlImportStateBatch): string {
  if (batch.stateFragment === undefined) throw new Error("Ожидался двоичный фрагмент состояния")
  const fragment = openProjectStateFragment(batch.stateFragment)
  return fragment.stringValue(fragment.fileRecord(0).projectPathId)
}

function configurationProjectPaths(batch: XmlImportStateBatch): string[] {
  if (batch.configurationFragment !== undefined) return [batch.configurationFragment.targetProjectPath]
  if (batch.configurationFragmentBuffer === undefined) return []
  return decodeConfigurationBlockFragments(batch.configurationFragmentBuffer)
    .map(({ targetProjectPath }) => targetProjectPath)
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
    update: { ...update, targets: [], owners: [], fields: [], forms: [] },
    hash: 1n,
  }])
  return { updates: [update], hashBytes: encoded.hashBytes }
}

async function waitForBothSinks(
  counter: { value: number },
  bothStarted: ReturnType<typeof gate>,
): Promise<void> {
  counter.value += 1
  if (counter.value === 2) bothStarted.start()
  await bothStarted.started
}

function gate() {
  let release!: () => void
  let notifyStarted!: () => void
  const promise = new Promise<void>((resolve) => { release = resolve })
  const started = new Promise<void>((resolve) => { notifyStarted = resolve })
  return {
    started,
    release,
    start: notifyStarted,
    async wait() {
      notifyStarted()
      await promise
    },
  }
}

async function promiseStatus(value: Promise<unknown>): Promise<"pending" | "settled"> {
  return Promise.race([
    value.then(() => "settled" as const),
    new Promise<"pending">((resolve) => setImmediate(() => resolve("pending"))),
  ])
}

async function expectPendingAggregate(
  running: Promise<unknown>,
  started: Promise<unknown>,
  release: () => void,
  expected: readonly unknown[],
): Promise<void> {
  const outcome = running.catch((error: unknown) => error)
  await started
  await new Promise<void>((resolve) => setImmediate(resolve))
  expect(await promiseStatus(outcome)).toBe("pending")
  release()
  const failure = await outcome
  expect(failure).toBeInstanceOf(AggregateError)
  expect((failure as AggregateError).errors).toEqual(expected)
}

function readTokens(count: number): ProjectStateReadToken[] {
  return Array.from({ length: count }, () => createTestProjectStateReadToken())
}

function createTempDir(name: string): string {
  const dir = fs.mkdtempSync(join(os.tmpdir(), `nkdk-worker-pool-${name}-`))
  tempDirs.push(dir)
  return dir
}
