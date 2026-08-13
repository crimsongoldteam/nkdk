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
  openConfigurationIndexStore,
} from "./store"

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

async function temporaryProject(): Promise<string> {
  const path = await mkdtemp(join(tmpdir(), "nkdk-configuration-index-"))
  temporaryDirectories.push(path)
  return path
}

async function createAndClose(descriptor: ReturnType<typeof configurationIndexStoreDescriptor>): Promise<void> {
  expect(descriptor.schemaVersion).toBe(CONFIGURATION_INDEX_SCHEMA_VERSION)
  await openConfigurationIndexStore(descriptor, "readWrite").close()
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
