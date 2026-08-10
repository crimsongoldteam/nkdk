import fs from "fs"
import { tmpdir } from "os"
import { dirname, join } from "path"
import { afterEach, describe, expect, it } from "vitest"
import { ConfigurationIndexCompatibilityError } from "./decode"
import { encodeConfigurationIndex } from "./encode"
import { configurationIndexPath } from "./fileIO"
import {
  createConfigurationIndexAssignmentLookupStats,
  createConfigurationIndexReader,
  readConfigurationIndexSnapshot,
  snapshotConfigurationIndex,
} from "./sharedSnapshot"
import { reverseInputOrder, sampleSnapshot, TEST_UUID } from "./testData"
import { buildBinaryHashIndex } from "@nkdk/runtime"

describe("shared configuration index snapshot", () => {
  const projectDirs: string[] = []

  afterEach(async () => {
    await Promise.all(projectDirs.splice(0).map((projectDir) => fs.promises.rm(projectDir, { recursive: true })))
  })

  async function createProjectDir(): Promise<string> {
    const projectDir = await fs.promises.mkdtemp(join(tmpdir(), "nkdk-shared-index-"))
    projectDirs.push(projectDir)
    return projectDir
  }

  it("exposes complete entities through sorted streaming readers", () => {
    const data = sampleSnapshot()
    const encoded = encodeConfigurationIndex(reverseInputOrder(data))

    const snapshot = snapshotConfigurationIndex(encoded)
    const first = createConfigurationIndexReader(snapshot)
    const second = createConfigurationIndexReader(snapshot)

    expect(snapshot.stringLookup.slots).toBeInstanceOf(SharedArrayBuffer)
    expect(first.snapshot.stringLookup.slots).toBe(second.snapshot.stringLookup.slots)
    expect(first.snapshot.fileLookup.slots).toBe(second.snapshot.fileLookup.slots)
    expect(first.snapshot.entityLookup.slots).toBe(second.snapshot.entityLookup.slots)
    expect(first.snapshot.sourceEntityLookup.slots).toBe(second.snapshot.sourceEntityLookup.slots)
    expect(first.snapshot.sourceEntityOffsets).toBe(second.snapshot.sourceEntityOffsets)
    expect(first.snapshot.sourceEntityRanges).toBe(second.snapshot.sourceEntityRanges)

    expect(first.header()).toEqual({
      specificationVersion: "1.3",
      indexGeneration: 7n,
      componentPath: "cf",
    })
    expect(second.snapshot.bytes).toBe(snapshot.bytes)
    expect(snapshot.byteLength).toBe(encoded.byteLength)
    expect(first.file("Документы/Заказ.yaml")).toEqual({
      projectPath: "Документы/Заказ.yaml",
      contentHash: 2n,
    })
    expect(first.file("Нет.yaml")).toBeUndefined()
    expect([...first.files()]).toEqual([
      { projectPath: "Configuration.yaml", contentHash: 1n },
      { projectPath: "Документы/Заказ.yaml", contentHash: 2n },
    ])
    expect(first.entity("Документ.Заказ")?.identities?.uuid).toBe(TEST_UUID)
    expect(first.entity("Документ.Заказ")).toEqual(data.entities[1])
    expect(first.entity("Нет")).toBeUndefined()
    expect([...first.entities()]).toEqual([data.entities[1], data.entities[0]])
    expect([...first.entitiesBySourceProjectPath("Документы/Заказ.yaml")]).toEqual([first.entity("Документ.Заказ")])
    expect([...first.entitiesBySourceProjectPath("Нет.yaml")]).toEqual([])
    expect(first).not.toHaveProperty("identities")
    expect(first).not.toHaveProperty("xmlNodes")
    expect(first).not.toHaveProperty("xmlValue")
  })

  it("подтверждает исходные ключи при коллизиях всех lookup-таблиц", () => {
    const options = {
      hashStringBytes: () => 5n,
      hashStringId: () => 7n,
    }
    const data = sampleSnapshot()
    const snapshot = snapshotConfigurationIndex(encodeConfigurationIndex(data), options)
    const reader = createConfigurationIndexReader(snapshot, options)

    expect(reader.file("Configuration.yaml")).toEqual(
      data.files.find(({ projectPath }) => projectPath === "Configuration.yaml")
    )
    expect(reader.file("Документы/Заказ.yaml")).toEqual(
      data.files.find(({ projectPath }) => projectPath === "Документы/Заказ.yaml")
    )
    expect(reader.entity(data.entities[0]!.logicalAddress)).toEqual(data.entities[0])
    expect(reader.entity(data.entities[1]!.logicalAddress)).toEqual(data.entities[1])
    expect([...reader.entitiesBySourceProjectPath(data.entities[0]!.sourceProjectPath)])
      .toContainEqual(data.entities[0])
    expect(reader.file("Нет.yaml")).toBeUndefined()
    expect(reader.entity("Нет")).toBeUndefined()
  })

  it("связывает sourceProjectPath с числовым диапазоном текущего снимка", () => {
    const data = sampleSnapshot()
    const reader = createConfigurationIndexReader(
      snapshotConfigurationIndex(encodeConfigurationIndex(data)),
    )

    const range = reader.entityRange("Документы/Заказ.yaml")

    expect(range.count).toBe(1)
    expect(reader.entityRange("Новый.yaml")).toEqual({ start: 0, count: 0 })
    expect(reader.forEntityRange(range).entity("Документ.Заказ")).toEqual(data.entities[1])
  })

  it("сначала читает entity локально, кэширует декодирование и считает fallback", () => {
    const data = sampleSnapshot()
    const reader = createConfigurationIndexReader(
      snapshotConfigurationIndex(encodeConfigurationIndex(data)),
    )
    const stats = createConfigurationIndexAssignmentLookupStats()
    const local = reader.forEntityRange(reader.entityRange("Документы/Заказ.yaml"), stats)

    expect(local.entity("Документ.Заказ")).toEqual(data.entities[1])
    expect(local.entity("Документ.Заказ")).toEqual(data.entities[1])
    expect(local.entity("Конфигурация")).toEqual(data.entities[0])
    expect(local.entity("Конфигурация")).toEqual(data.entities[0])
    expect(stats).toEqual({
      localHits: 2,
      localMisses: 2,
      globalFallbacks: 1,
      decodedEntities: 2,
      rangeEntities: 1,
    })
  })

  it("не принимает entity соседнего диапазона за локальную", () => {
    const reader = createConfigurationIndexReader(
      snapshotConfigurationIndex(encodeConfigurationIndex(sampleSnapshot())),
    )
    const stats = createConfigurationIndexAssignmentLookupStats()
    const local = reader.forEntityRange(reader.entityRange("Документы/Заказ.yaml"), stats)

    expect(local.entity("Конфигурация")).toEqual(reader.entity("Конфигурация"))
    expect(stats.localHits).toBe(0)
    expect(stats.globalFallbacks).toBe(1)
  })

  it("отвергает выход локального диапазона за границы снимка", () => {
    const reader = createConfigurationIndexReader(
      snapshotConfigurationIndex(encodeConfigurationIndex(sampleSnapshot())),
    )

    expect(() => reader.forEntityRange({ start: 1, count: 2 }))
      .toThrow("Повреждён диапазон entity индекса конфигурации")
  })

  it("отвергает повторный logicalAddress внутри локального диапазона", () => {
    const snapshot = snapshotConfigurationIndex(encodeConfigurationIndex(sampleSnapshot()))
    const reader = createConfigurationIndexReader(snapshot)
    const sourceOffsets = new Uint32Array(snapshot.sourceEntityOffsets)
    sourceOffsets[1] = sourceOffsets[0]!

    expect(() => reader.forEntityRange({ start: 0, count: 2 }))
      .toThrow("Повторяется logicalAddress entity в диапазоне")
  })

  it("отвергает повреждённую перестановку source entity offsets", () => {
    const snapshot = snapshotConfigurationIndex(encodeConfigurationIndex(sampleSnapshot()))
    const corruptedOffsets = new Uint32Array(new SharedArrayBuffer(snapshot.sourceEntityOffsets.byteLength))
    corruptedOffsets.set(new Uint32Array(snapshot.sourceEntityOffsets))
    corruptedOffsets[0] = corruptedOffsets[1]!

    expect(() => createConfigurationIndexReader({
      ...snapshot,
      sourceEntityOffsets: corruptedOffsets.buffer as SharedArrayBuffer,
    })).toThrow(/Повреждён lookup/iu)
  })

  it("отвергает lookup recordId за границей исходной секции", () => {
    const snapshot = snapshotConfigurationIndex(encodeConfigurationIndex(sampleSnapshot()))
    const corruptedLookup = buildBinaryHashIndex(
      new BigUint64Array([1n]),
      new Uint32Array([0xffffffff]),
    )

    expect(() => createConfigurationIndexReader({
      ...snapshot,
      entityLookup: corruptedLookup,
    })).toThrow(/Повреждён lookup/iu)
  })

  it("rejects incompatible or corrupted index before creating a shared buffer", () => {
    const encoded = encodeConfigurationIndex(sampleSnapshot())
    const corrupted = Buffer.from(encoded)
    corrupted[0] = 0

    expect(() => snapshotConfigurationIndex(corrupted)).toThrow("Некорректный файл индекса конфигурации")
    expect(() => snapshotConfigurationIndex(encoded, { expectedComponentPath: "cfe/Расширение" })).toThrowError(
      ConfigurationIndexCompatibilityError
    )
  })

  it("reads the configuration component index into shared memory", async () => {
    const projectDir = await createProjectDir()
    const data = sampleSnapshot()
    const indexPath = configurationIndexPath(projectDir, { kind: "configuration" })
    await fs.promises.mkdir(dirname(indexPath), { recursive: true })
    await fs.promises.writeFile(indexPath, encodeConfigurationIndex(data))

    const snapshot = await readConfigurationIndexSnapshot({ projectDir, address: { kind: "configuration" } })
    expect(createConfigurationIndexReader(snapshot).header()).toEqual({
      specificationVersion: "1.3",
      indexGeneration: 7n,
      componentPath: "cf",
    })
    expect(Buffer.from(new Uint8Array(snapshot.bytes, 0, snapshot.byteLength))).toEqual(
      await fs.promises.readFile(indexPath)
    )
  })
})
