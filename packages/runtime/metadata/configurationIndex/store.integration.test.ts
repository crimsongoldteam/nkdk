import { existsSync } from "node:fs"
import { open, type Database } from "lmdb"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { encodeBlockV1, encodeContentHash } from "./blockCodec"
import {
  CONFIGURATION_INDEX_SCHEMA_VERSION,
  configurationIndexStoreDescriptor,
  openConfigurationIndexStore,
} from "./store"
import type { ConfigurationIndexStore } from "./store"
import { ConfigurationIndexStoreTestScope } from "./storeTestScope"

const scope = new ConfigurationIndexStoreTestScope()
let createdDescriptor: ReturnType<typeof configurationIndexStoreDescriptor>
let schemaVersion: readonly number[]
let openedTableNames: readonly string[]
let hashReader: ConfigurationIndexStore
let blockReader: ConfigurationIndexStore
let hashOnlyReader: ConfigurationIndexStore
let pendingReader: ConfigurationIndexStore
let missingDescriptor: ReturnType<typeof configurationIndexStoreDescriptor>
let unknownSchemaDescriptor: ReturnType<typeof configurationIndexStoreDescriptor>
let closeStore: ConfigurationIndexStore

beforeAll(async () => {
  createdDescriptor = configurationIndexStoreDescriptor(await scope.temporaryProject(), { kind: "configuration" })
  scope.open(createdDescriptor, "readWrite")

  const schemaDescriptor = configurationIndexStoreDescriptor(await scope.temporaryProject(), { kind: "configuration" })
  await createAndClose(schemaDescriptor)
  const root = open<Uint8Array, string>({
    path: schemaDescriptor.dataPath,
    noSubdir: true,
    encoding: "binary",
    maxDbs: 8,
  })
  const meta = root.openDB<Uint8Array, string>({ name: "meta", encoding: "binary" })
  schemaVersion = [...meta.get("schemaVersion")!]
  openedTableNames = ["hashes", "blocks", "pendingHashes", "pendingBlocks"].map((name) => {
    root.openDB({ name, encoding: "binary" })
    return name
  })
  await root.close()

  const hashDescriptor = configurationIndexStoreDescriptor(await scope.temporaryProject(), { kind: "configuration" })
  await createAndClose(hashDescriptor)
  await writeRaw(hashDescriptor.dataPath, (table) => {
    table("hashes").putSync("é.yaml", encodeContentHash(2n))
    table("hashes").putSync("z.yaml", encodeContentHash(1n))
    table("blocks").putSync("broken.yaml", Uint8Array.of(255))
  })
  hashReader = scope.open(hashDescriptor, "readOnly")

  const blockDescriptor = configurationIndexStoreDescriptor(await scope.temporaryProject(), { kind: "configuration" })
  await createAndClose(blockDescriptor)
  const goodBlock = { entities: [{ logicalAddress: "Документ.Заказ", xmlId: "1" }] }
  await writeRaw(blockDescriptor.dataPath, (table) => {
    table("hashes").putSync("Документы/Заказ.yaml", encodeContentHash(1n))
    table("blocks").putSync("Документы/Заказ.yaml", encodeBlockV1(goodBlock))
    table("blocks").putSync("broken.yaml", Uint8Array.of(255))
  })
  blockReader = scope.open(blockDescriptor, "readOnly")

  const hashOnlyDescriptor = configurationIndexStoreDescriptor(await scope.temporaryProject(), { kind: "configuration" })
  await createAndClose(hashOnlyDescriptor)
  await writeRaw(
    hashOnlyDescriptor.dataPath,
    (table) => table("hashes").putSync("Модуль.bsl", encodeContentHash(7n)),
  )
  hashOnlyReader = scope.open(hashOnlyDescriptor, "readOnly")

  const pendingDescriptor = configurationIndexStoreDescriptor(await scope.temporaryProject(), { kind: "configuration" })
  await createAndClose(pendingDescriptor)
  await writeRaw(pendingDescriptor.dataPath, (table) => {
    table("pendingBlocks").putSync("А.yaml", Uint8Array.of(0))
  })
  pendingReader = scope.open(pendingDescriptor, "readOnly")

  missingDescriptor = configurationIndexStoreDescriptor(await scope.temporaryProject(), { kind: "configuration" })
  unknownSchemaDescriptor = configurationIndexStoreDescriptor(await scope.temporaryProject(), { kind: "configuration" })
  await createAndClose(unknownSchemaDescriptor)
  await writeRaw(unknownSchemaDescriptor.dataPath, (table) => {
    table("meta").putSync("schemaVersion", Uint8Array.of(CONFIGURATION_INDEX_SCHEMA_VERSION + 1, 0, 0, 0))
  })

  const closeDescriptor = configurationIndexStoreDescriptor(await scope.temporaryProject(), { kind: "configuration" })
  closeStore = scope.open(closeDescriptor, "readWrite")
})

afterAll(async () => {
  await scope.close()
})

describe("configuration index store", () => {
  it("places configuration data and lock under the component directory", () => {
    expect(existsSync(createdDescriptor.dataPath)).toBe(true)
    expect(existsSync(createdDescriptor.lockPath)).toBe(true)
  })

  it("creates all named tables and schema version", () => {
    expect(schemaVersion).toEqual([CONFIGURATION_INDEX_SCHEMA_VERSION, 0, 0, 0])
    expect(openedTableNames).toEqual(["hashes", "blocks", "pendingHashes", "pendingBlocks"])
  })

  it("reads hashes without touching an unrelated corrupt block", () => {
    expect(hashReader.readHashes()).toEqual([
      { projectPath: "z.yaml", contentHash: 1n },
      { projectPath: "é.yaml", contentHash: 2n },
    ])
  })

  it("reads only requested unique blocks", () => {
    const goodBlock = { entities: [{ logicalAddress: "Документ.Заказ", xmlId: "1" }] }
    expect(blockReader.getBlocks(["Документы/Заказ.yaml", "Документы/Заказ.yaml"])).toEqual(
      new Map([["Документы/Заказ.yaml", goodBlock]]),
    )
    expect(blockReader.hasBlock("Документы/Заказ.yaml")).toBe(true)
    expect(blockReader.hasBlock("missing.yaml")).toBe(false)
  })

  it("accepts a hash without a block", () => {
    expect(hashOnlyReader.readHashes()).toEqual([{ projectPath: "Модуль.bsl", contentHash: 7n }])
    expect(hashOnlyReader.getBlocks(["Модуль.bsl"])).toEqual(new Map())
  })

  it("reports pending data from either pending table", () => {
    expect(pendingReader.hasPending()).toBe(true)
  })

  it("includes the absolute data path when a read-only snapshot is missing", () => {
    expect(() => openConfigurationIndexStore(missingDescriptor, "readOnly")).toThrow(
      `Не удалось открыть снимок ${missingDescriptor.dataPath}`,
    )
  })

  it("rejects an unknown schema version with the absolute data path", () => {
    expect(() => openConfigurationIndexStore(unknownSchemaDescriptor, "readOnly")).toThrow(
      `Не удалось открыть снимок ${unknownSchemaDescriptor.dataPath}`,
    )
  })

  it("closes idempotently", async () => {
    await closeStore.close()
    await expect(closeStore.close()).resolves.toBeUndefined()
  })
})

async function createAndClose(descriptor: ReturnType<typeof configurationIndexStoreDescriptor>): Promise<void> {
  if (descriptor.schemaVersion !== CONFIGURATION_INDEX_SCHEMA_VERSION) throw new Error("Unexpected schema version")
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
