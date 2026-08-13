import { existsSync } from "node:fs"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { open, type Database } from "lmdb"
import { afterEach, describe, expect, it } from "vitest"
import { encodeConfigurationIndexBlock, encodeContentHash } from "./blockCodec"
import {
  CONFIGURATION_INDEX_SCHEMA_VERSION,
  configurationIndexStoreDescriptor,
  createConfigurationIndexCandidateStore,
  openConfigurationIndexStore,
} from "./store"
import type { ConfigurationIndexCandidateStore } from "./store"

const temporaryDirectories: string[] = []

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((path) => rm(path, { recursive: true, force: true })))
})

describe("configuration index store", () => {
  it("places configuration data and lock under the component directory", async () => {
    const projectDir = await temporaryProject()
    const descriptor = configurationIndexStoreDescriptor(projectDir, { kind: "configuration" })

    expect(descriptor).toEqual({
      dataPath: join(projectDir, ".nkdk/components/cf/configuration-index.lmdb"),
      lockPath: join(projectDir, ".nkdk/components/cf/configuration-index.lmdb-lock"),
      schemaVersion: 1,
    })

    const store = openConfigurationIndexStore(descriptor, "readWrite")
    expect(existsSync(descriptor.dataPath)).toBe(true)
    expect(existsSync(descriptor.lockPath)).toBe(true)
    await store.close()
  })

  it("creates all named tables and schema version", async () => {
    const descriptor = configurationIndexStoreDescriptor(await temporaryProject(), { kind: "configuration" })
    const store = openConfigurationIndexStore(descriptor, "readWrite")
    await store.close()

    const root = open<Uint8Array, string>({ path: descriptor.dataPath, noSubdir: true, encoding: "binary", maxDbs: 8 })
    const meta = root.openDB<Uint8Array, string>({ name: "meta", encoding: "binary" })
    expect([...meta.get("schemaVersion")!]).toEqual([1, 0, 0, 0])
    for (const name of ["hashes", "blocks", "pendingHashes", "pendingBlocks"]) {
      expect(() => root.openDB({ name, encoding: "binary" })).not.toThrow()
    }
    await root.close()
  })

  it("reads hashes without touching an unrelated corrupt block", async () => {
    const descriptor = configurationIndexStoreDescriptor(await temporaryProject(), { kind: "configuration" })
    await createAndClose(descriptor)
    await writeRaw(descriptor.dataPath, (table) => {
      table("hashes").putSync("é.yaml", encodeContentHash(2n))
      table("hashes").putSync("z.yaml", encodeContentHash(1n))
      table("blocks").putSync("broken.yaml", Uint8Array.of(255))
    })

    const store = openConfigurationIndexStore(descriptor, "readOnly")
    expect(store.readHashes()).toEqual([
      { projectPath: "z.yaml", contentHash: 1n },
      { projectPath: "é.yaml", contentHash: 2n },
    ])
    await store.close()
  })

  it("reads only requested unique blocks", async () => {
    const descriptor = configurationIndexStoreDescriptor(await temporaryProject(), { kind: "configuration" })
    await createAndClose(descriptor)
    const goodBlock = { entities: [{ logicalAddress: "Документ.Заказ", xmlId: "1" }] }
    await writeRaw(descriptor.dataPath, (table) => {
      table("hashes").putSync("Документы/Заказ.yaml", encodeContentHash(1n))
      table("blocks").putSync("Документы/Заказ.yaml", encodeConfigurationIndexBlock(goodBlock))
      table("blocks").putSync("broken.yaml", Uint8Array.of(255))
    })

    const store = openConfigurationIndexStore(descriptor, "readOnly")
    expect(store.getBlocks(["Документы/Заказ.yaml", "Документы/Заказ.yaml"])).toEqual(
      new Map([["Документы/Заказ.yaml", goodBlock]]),
    )
    expect(store.hasBlock("Документы/Заказ.yaml")).toBe(true)
    expect(store.hasBlock("missing.yaml")).toBe(false)
    await store.close()
  })

  it.each(["", "a\0b", "a\\b", "./a", "a/../b", "/absolute"])(
    "rejects invalid project path %j",
    async (projectPath) => {
      const descriptor = configurationIndexStoreDescriptor(await temporaryProject(), { kind: "configuration" })
      const store = openConfigurationIndexStore(descriptor, "readWrite")
      expect(() => store.getBlocks([projectPath])).toThrow()
      await store.close()
    },
  )

  it("accepts a hash without a block", async () => {
    const descriptor = configurationIndexStoreDescriptor(await temporaryProject(), { kind: "configuration" })
    await createAndClose(descriptor)
    await writeRaw(descriptor.dataPath, (table) => table("hashes").putSync("Модуль.bsl", encodeContentHash(7n)))

    const store = openConfigurationIndexStore(descriptor, "readOnly")
    expect(store.readHashes()).toEqual([{ projectPath: "Модуль.bsl", contentHash: 7n }])
    expect(store.getBlocks(["Модуль.bsl"])).toEqual(new Map())
    await store.close()
  })

  it("reports pending data from either pending table", async () => {
    const descriptor = configurationIndexStoreDescriptor(await temporaryProject(), { kind: "configuration" })
    await createAndClose(descriptor)
    await writeRaw(descriptor.dataPath, (table) => table("pendingBlocks").putSync("А.yaml", Uint8Array.of(0)))

    const store = openConfigurationIndexStore(descriptor, "readOnly")
    expect(store.hasPending()).toBe(true)
    await store.close()
  })

  it("includes the absolute data path when a read-only snapshot is missing", async () => {
    const descriptor = configurationIndexStoreDescriptor(await temporaryProject(), { kind: "configuration" })

    expect(() => openConfigurationIndexStore(descriptor, "readOnly")).toThrow(
      `Не удалось открыть снимок ${descriptor.dataPath}`,
    )
  })

  it("rejects an unknown schema version with the absolute data path", async () => {
    const descriptor = configurationIndexStoreDescriptor(await temporaryProject(), { kind: "configuration" })
    await createAndClose(descriptor)
    await writeRaw(descriptor.dataPath, (table) => table("meta").putSync("schemaVersion", Uint8Array.of(2, 0, 0, 0)))

    expect(() => openConfigurationIndexStore(descriptor, "readOnly")).toThrow(
      `Не удалось открыть снимок ${descriptor.dataPath}`,
    )
  })

  it("closes idempotently", async () => {
    const descriptor = configurationIndexStoreDescriptor(await temporaryProject(), { kind: "configuration" })
    const store = openConfigurationIndexStore(descriptor, "readWrite")

    await store.close()
    await expect(store.close()).resolves.toBeUndefined()
  })
})

describe("configuration index publication", () => {
  it("replaces all active hashes and blocks in one publication", async () => {
    const projectDir = await temporaryProject()
    const active = openConfigurationIndexStore(
      configurationIndexStoreDescriptor(projectDir, { kind: "configuration" }),
      "readWrite",
    )
    const initial = await candidate(projectDir, "initial")
    initial.replaceHashes([{ projectPath: "old.yaml", contentHash: 1n }])
    initial.mergeBlockFragment({
      targetProjectPath: "old.yaml",
      entities: [{ logicalAddress: "Старый", xmlId: "1" }],
    })
    await active.replaceActiveFrom(initial)

    const replacement = await candidate(projectDir, "replacement")
    replacement.replaceHashes([
      { projectPath: "new.yaml", contentHash: 2n },
      { projectPath: "module.bsl", contentHash: 3n },
    ])
    replacement.mergeBlockFragment({
      targetProjectPath: "new.yaml",
      entities: [{ logicalAddress: "Новый", xmlId: "2" }],
    })
    await active.replaceActiveFrom(replacement)

    expect(active.readHashes()).toEqual([
      { projectPath: "module.bsl", contentHash: 3n },
      { projectPath: "new.yaml", contentHash: 2n },
    ])
    expect(active.getBlocks(["old.yaml", "new.yaml"])).toEqual(
      new Map([["new.yaml", { entities: [{ logicalAddress: "Новый", xmlId: "2" }] }]]),
    )
    await Promise.all([active.close(), initial.discard(), replacement.discard()])
  })

  it("keeps an earlier read session on its MVCC view", async () => {
    const projectDir = await temporaryProject()
    const descriptor = configurationIndexStoreDescriptor(projectDir, { kind: "configuration" })
    const active = openConfigurationIndexStore(descriptor, "readWrite")
    const initial = await candidate(projectDir, "mvcc-initial")
    initial.replaceHashes([{ projectPath: "А.yaml", contentHash: 1n }])
    await active.replaceActiveFrom(initial)

    const oldReader = openConfigurationIndexStore(descriptor, "readOnly")
    expect(oldReader.readHashes()).toEqual([{ projectPath: "А.yaml", contentHash: 1n }])
    const replacement = await candidate(projectDir, "mvcc-replacement")
    replacement.replaceHashes([{ projectPath: "Б.yaml", contentHash: 2n }])
    await active.replaceActiveFrom(replacement)

    expect(oldReader.readHashes()).toEqual([{ projectPath: "А.yaml", contentHash: 1n }])
    const newReader = openConfigurationIndexStore(descriptor, "readOnly")
    expect(newReader.readHashes()).toEqual([{ projectPath: "Б.yaml", contentHash: 2n }])
    await Promise.all([active.close(), oldReader.close(), newReader.close(), initial.discard(), replacement.discard()])
  })

  it("keeps disjoint pending hashes and blocks invisible until apply", async () => {
    const projectDir = await temporaryProject()
    const active = openConfigurationIndexStore(
      configurationIndexStoreDescriptor(projectDir, { kind: "configuration" }),
      "readWrite",
    )
    const initial = await candidate(projectDir, "pending-initial")
    initial.replaceHashes([{ projectPath: "А.yaml", contentHash: 1n }])
    initial.mergeBlockFragment({
      targetProjectPath: "А.yaml",
      entities: [{ logicalAddress: "А", xmlId: "1" }],
    })
    await active.replaceActiveFrom(initial)

    await active.writePending({
      hashes: new Map([["Б.bsl", { kind: "put", contentHash: 2n }]]),
      blocks: new Map([["А.yaml", { kind: "delete" }]]),
    })
    expect(active.hasPending()).toBe(true)
    expect(active.readHashes()).toEqual([{ projectPath: "А.yaml", contentHash: 1n }])
    expect(active.hasBlock("А.yaml")).toBe(true)
    expect(active.pendingAlreadyApplied()).toBe(false)

    await active.applyPending()
    expect(active.readHashes()).toEqual([
      { projectPath: "А.yaml", contentHash: 1n },
      { projectPath: "Б.bsl", contentHash: 2n },
    ])
    expect(active.hasBlock("А.yaml")).toBe(false)
    expect(active.hasPending()).toBe(true)
    expect(active.pendingAlreadyApplied()).toBe(true)

    await active.clearPending()
    expect(active.hasPending()).toBe(false)
    await Promise.all([active.close(), initial.discard()])
  })

  it("rejects a candidate block without a hash before changing active state", async () => {
    const projectDir = await temporaryProject()
    const active = openConfigurationIndexStore(
      configurationIndexStoreDescriptor(projectDir, { kind: "configuration" }),
      "readWrite",
    )
    const invalid = await candidate(projectDir, "invalid")
    invalid.mergeBlockFragment({
      targetProjectPath: "missing.yaml",
      entities: [{ logicalAddress: "А", xmlId: "1" }],
    })

    expect(() => invalid.validateCandidate()).toThrow("missing.yaml")
    await expect(active.replaceActiveFrom(invalid)).rejects.toThrow("missing.yaml")
    expect(active.readHashes()).toEqual([])
    await Promise.all([active.close(), invalid.discard()])
  })

  it("blocks full publication and a second prepare while pending exists", async () => {
    const projectDir = await temporaryProject()
    const active = openConfigurationIndexStore(
      configurationIndexStoreDescriptor(projectDir, { kind: "configuration" }),
      "readWrite",
    )
    await active.writePending({
      hashes: new Map([["А.yaml", { kind: "put", contentHash: 1n }]]),
      blocks: new Map(),
    })
    const replacement = await candidate(projectDir, "blocked")
    replacement.replaceHashes([{ projectPath: "А.yaml", contentHash: 1n }])

    await expect(active.replaceActiveFrom(replacement)).rejects.toThrow("pending")
    await expect(
      active.writePending({ hashes: new Map([["Б.yaml", { kind: "delete" }]]), blocks: new Map() }),
    ).rejects.toThrow("pending")
    await active.clearPending()
    await Promise.all([active.close(), replacement.discard()])
  })

  it("publishes an imported candidate by moving its data file", async () => {
    const projectDir = await temporaryProject()
    const descriptor = configurationIndexStoreDescriptor(projectDir, { kind: "configuration" })
    const active = openConfigurationIndexStore(descriptor, "readWrite")
    const imported = await candidate(projectDir, "imported", "import")
    imported.replaceHashes([{ projectPath: "А.yaml", contentHash: 4n }])
    const candidatePath = imported.descriptor().dataPath

    await active.publishImportedCandidate(imported)

    expect(existsSync(candidatePath)).toBe(false)
    expect(existsSync(`${candidatePath}-lock`)).toBe(false)
    const reader = openConfigurationIndexStore(descriptor, "readOnly")
    expect(reader.readHashes()).toEqual([{ projectPath: "А.yaml", contentHash: 4n }])
    await reader.close()
  })
})

async function temporaryProject(): Promise<string> {
  const path = await mkdtemp(join(tmpdir(), "nkdk-configuration-index-"))
  temporaryDirectories.push(path)
  return path
}

async function createAndClose(descriptor: ReturnType<typeof configurationIndexStoreDescriptor>): Promise<void> {
  expect(descriptor.schemaVersion).toBe(CONFIGURATION_INDEX_SCHEMA_VERSION)
  await openConfigurationIndexStore(descriptor, "readWrite").close()
}

async function candidate(
  projectDir: string,
  operationId: string,
  purpose: "import" | "full" | "partial" = "full",
): Promise<ConfigurationIndexCandidateStore> {
  return createConfigurationIndexCandidateStore({
    projectDir,
    address: { kind: "configuration" },
    operationId,
    purpose,
  })
}

type RawTableName = "meta" | "hashes" | "blocks" | "pendingHashes" | "pendingBlocks"
type RawTable = Database<Uint8Array, string>

async function writeRaw(dataPath: string, action: (table: (name: RawTableName) => RawTable) => void): Promise<void> {
  const root = open<Uint8Array, string>({ path: dataPath, noSubdir: true, encoding: "binary", maxDbs: 8 })
  const tables = new Map<RawTableName, RawTable>()
  const table = (name: RawTableName): RawTable => {
    const existing = tables.get(name)
    if (existing !== undefined) return existing
    const created = root.openDB<Uint8Array, string>({ name, encoding: "binary" })
    tables.set(name, created)
    return created
  }
  root.transactionSync(() => action(table))
  await root.close()
}
