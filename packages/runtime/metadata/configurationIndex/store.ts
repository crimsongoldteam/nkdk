import { existsSync, mkdirSync } from "node:fs"
import { rename, rm } from "node:fs/promises"
import { dirname } from "node:path"
import { open, type Database, type RootDatabase, type Transaction } from "lmdb"
import {
  decodeBlockV1,
  decodeContentHash,
  decodePendingValue,
  encodeBlockV1,
  encodeContentHash,
  encodePendingDelete,
  encodePendingPut,
} from "./blockCodec"
import type { ComponentAddress } from "../components/address"
import type {
  ConfigurationIndexBlock,
  ConfigurationIndexBlockEntity,
  ConfigurationIndexBlockFragment,
  ConfigurationProjectFile,
} from "./types"
export {
  CONFIGURATION_INDEX_SCHEMA_VERSION,
  configurationIndexCandidateStoreDescriptor,
  configurationIndexStoreDescriptor,
} from "./storePath"
import {
  compareConfigurationIndexUtf8,
  configurationIndexErrorMessage,
  validateConfigurationIndexProjectPath as validateProjectPath,
} from "./utilities"
export { validateConfigurationIndexProjectPath } from "./utilities"
import {
  CONFIGURATION_INDEX_SCHEMA_VERSION,
  configurationIndexCandidateStoreDescriptor,
  type ConfigurationIndexStoreDescriptor,
} from "./storePath"

export type { ConfigurationIndexStoreDescriptor } from "./storePath"

export interface ConfigurationIndexStore {
  descriptor(): ConfigurationIndexStoreDescriptor
  readHashes(): readonly { projectPath: string; contentHash: bigint }[]
  getBlocks(projectPaths: readonly string[]): ReadonlyMap<string, ConfigurationIndexBlock>
  hasBlock(projectPath: string): boolean
  hasPending(): boolean
  replaceActiveFrom(candidate: ConfigurationIndexCandidateStore): Promise<void>
  publishImportedCandidate(candidate: ConfigurationIndexCandidateStore): Promise<void>
  writePending(delta: ConfigurationIndexPendingDelta): Promise<void>
  pendingAlreadyApplied(): boolean
  applyPending(): Promise<void>
  clearPending(): Promise<void>
  flush(): Promise<void>
  close(): Promise<void>
}

export interface ConfigurationIndexCandidateStore extends ConfigurationIndexStore {
  mergeBlockFragments(fragments: readonly ConfigurationIndexBlockFragment[]): void
  replaceHashes(files: readonly ConfigurationProjectFile[]): void
  copyActiveBlocksFrom(source: ConfigurationIndexStore, excludedProjectPaths: ReadonlySet<string>): void
  validateCandidate(): void
  discard(): Promise<void>
}

export interface ConfigurationIndexPendingDelta {
  readonly hashes: ReadonlyMap<string, { readonly kind: "put"; readonly contentHash: bigint } | { readonly kind: "delete" }>
  readonly blocks: ReadonlyMap<
    string,
    { readonly kind: "put"; readonly block: ConfigurationIndexBlock } | { readonly kind: "delete" }
  >
}

interface ConfigurationIndexTables {
  readonly meta: Database<Uint8Array, string>
  readonly hashes: Database<Uint8Array, string>
  readonly blocks: Database<Uint8Array, string>
  readonly pendingHashes: Database<Uint8Array, string>
  readonly pendingBlocks: Database<Uint8Array, string>
}

export function openConfigurationIndexStore(
  descriptor: ConfigurationIndexStoreDescriptor,
  mode: "readOnly" | "readWrite",
): ConfigurationIndexStore {
  let root: RootDatabase<Uint8Array, string> | undefined
  try {
    validateDescriptor(descriptor)
    if (mode === "readOnly" && !existsSync(descriptor.dataPath)) throw new Error("Файл не существует")
    if (mode === "readWrite") mkdirSync(dirname(descriptor.dataPath), { recursive: true })
    root = openRoot(descriptor, mode)
    const tables = openTables(root)
    initializeOrValidateSchema(root, tables.meta, mode)
    return new LmdbConfigurationIndexStore(descriptor, root, tables, mode, false)
  } catch (error) {
    if (root !== undefined) void root.close()
    throw new Error(`Не удалось открыть снимок ${descriptor.dataPath}: ${errorMessage(error)}`, { cause: error })
  }
}

export async function createConfigurationIndexCandidateStore(params: {
  readonly projectDir: string
  readonly address: ComponentAddress
  readonly operationId: string
  readonly purpose: "import" | "full" | "partial"
}): Promise<ConfigurationIndexCandidateStore> {
  const descriptor = configurationIndexCandidateStoreDescriptor(params)
  if (existsSync(descriptor.dataPath) || existsSync(descriptor.lockPath)) {
    throw new Error(`Временный снимок уже существует: ${descriptor.dataPath}`)
  }
  let root: RootDatabase<Uint8Array, string> | undefined
  try {
    mkdirSync(dirname(descriptor.dataPath), { recursive: true })
    root = openRoot(descriptor, "readWrite")
    const tables = openTables(root)
    initializeOrValidateSchema(root, tables.meta, "readWrite")
    return new LmdbConfigurationIndexStore(descriptor, root, tables, "readWrite", true)
  } catch (error) {
    if (root !== undefined) await root.close()
    throw new Error(`Не удалось создать временный снимок ${descriptor.dataPath}: ${errorMessage(error)}`, { cause: error })
  }
}

class LmdbConfigurationIndexStore implements ConfigurationIndexStore {
  private closePromise: Promise<void> | undefined
  private readonly readTransaction: Transaction | undefined
  private relocated = false

  constructor(
    private readonly storeDescriptor: ConfigurationIndexStoreDescriptor,
    private readonly root: RootDatabase<Uint8Array, string>,
    private readonly tables: ConfigurationIndexTables,
    mode: "readOnly" | "readWrite",
    private readonly candidate: boolean,
  ) {
    this.readTransaction = mode === "readOnly" ? root.useReadTransaction() : undefined
  }

  descriptor(): ConfigurationIndexStoreDescriptor {
    return this.storeDescriptor
  }

  readHashes(): readonly { projectPath: string; contentHash: bigint }[] {
    const result = [...this.tables.hashes.getRange(this.readOptions())].map(({ key, value }) => ({
      projectPath: validateProjectPath(key),
      contentHash: decodeContentHash(value),
    }))
    return result.sort((left, right) => compareConfigurationIndexUtf8(left.projectPath, right.projectPath))
  }

  getBlocks(projectPaths: readonly string[]): ReadonlyMap<string, ConfigurationIndexBlock> {
    const requested = [...new Set(projectPaths.map(validateProjectPath))].sort(compareConfigurationIndexUtf8)
    const result = new Map<string, ConfigurationIndexBlock>()
    for (const projectPath of requested) {
      const value = this.tables.blocks.get(projectPath, this.readOptions())
      if (value !== undefined) result.set(projectPath, decodeBlockV1(value))
    }
    return result
  }

  hasBlock(projectPath: string): boolean {
    return this.tables.blocks.get(validateProjectPath(projectPath), this.readOptions()) !== undefined
  }

  hasPending(): boolean {
    return this.tables.pendingHashes.getCount(this.readOptions()) !== 0
      || this.tables.pendingBlocks.getCount(this.readOptions()) !== 0
  }

  replaceHashes(files: readonly ConfigurationProjectFile[]): void {
    this.assertCandidate()
    const entries = files.map((file) => ({
      projectPath: validateProjectPath(file.projectPath),
      value: encodeContentHash(file.contentHash),
    }))
    assertUniquePaths(entries.map(({ projectPath }) => projectPath), "hashes")
    this.root.transactionSync(() => {
      this.tables.hashes.clearSync()
      for (const entry of entries) this.tables.hashes.putSync(entry.projectPath, entry.value)
    })
  }

  mergeBlockFragments(fragments: readonly ConfigurationIndexBlockFragment[]): void {
    this.assertCandidate()
    if (fragments.length === 0) return
    this.root.transactionSync(() => {
      for (const fragment of fragments) {
        const projectPath = validateProjectPath(fragment.targetProjectPath)
        if (fragment.entities.length === 0) {
          this.tables.blocks.removeSync(projectPath)
          continue
        }
        const existingValue = this.tables.blocks.get(projectPath)
        const existing = existingValue === undefined ? { entities: [] } : decodeBlockV1(existingValue)
        const merged = mergeBlockEntities(existing.entities, fragment.entities)
        const encoded = encodeBlockV1({ entities: merged })
        this.tables.blocks.putSync(projectPath, encoded)
      }
    })
  }

  copyActiveBlocksFrom(source: ConfigurationIndexStore, excludedProjectPaths: ReadonlySet<string>): void {
    this.assertCandidate()
    const sourceStore = asLmdbStore(source)
    const excluded = new Set([...excludedProjectPaths].map(validateProjectPath))
    this.root.transactionSync(() => {
      for (const { key, value } of sourceStore.tables.blocks.getRange(sourceStore.readOptions())) {
        if (!excluded.has(key)) this.tables.blocks.putSync(validateProjectPath(key), value)
      }
    })
  }

  validateCandidate(): void {
    this.assertCandidate()
    for (const { key, value } of this.tables.blocks.getRange()) {
      const projectPath = validateProjectPath(key)
      decodeBlockV1(value)
      if (!this.tables.hashes.doesExist(projectPath)) {
        throw new Error(`Блок не имеет соответствующего hash: ${projectPath}`)
      }
    }
    for (const { key, value } of this.tables.hashes.getRange()) {
      validateProjectPath(key)
      decodeContentHash(value)
    }
  }

  async replaceActiveFrom(candidate: ConfigurationIndexCandidateStore): Promise<void> {
    const candidateStore = asCandidateStore(candidate)
    candidateStore.validateCandidate()
    this.assertNoPending()
    this.root.transactionSync(() => {
      this.assertNoPending()
      this.tables.hashes.clearSync()
      this.tables.blocks.clearSync()
      for (const { key, value } of candidateStore.tables.hashes.getRange()) this.tables.hashes.putSync(key, value)
      for (const { key, value } of candidateStore.tables.blocks.getRange()) this.tables.blocks.putSync(key, value)
    })
    await this.flush()
  }

  async publishImportedCandidate(candidate: ConfigurationIndexCandidateStore): Promise<void> {
    const candidateStore = asCandidateStore(candidate)
    candidateStore.validateCandidate()
    this.assertNoPending()
    await Promise.all([this.flush(), candidateStore.flush()])
    await Promise.all([this.close(), candidateStore.close()])
    await Promise.all([
      rm(this.storeDescriptor.lockPath, { force: true }),
      rm(candidateStore.storeDescriptor.lockPath, { force: true }),
    ])
    await rename(candidateStore.storeDescriptor.dataPath, this.storeDescriptor.dataPath)
    candidateStore.relocated = true
  }

  async writePending(delta: ConfigurationIndexPendingDelta): Promise<void> {
    const hashEntries = [...delta.hashes].map(([projectPath, value]) => ({
      projectPath: validateProjectPath(projectPath),
      value: value.kind === "delete" ? encodePendingDelete() : encodePendingPut(encodeContentHash(value.contentHash)),
    }))
    const blockEntries = [...delta.blocks].map(([projectPath, value]) => ({
      projectPath: validateProjectPath(projectPath),
      value: value.kind === "delete" ? encodePendingDelete() : encodePendingPut(encodeBlockV1(value.block)),
    }))
    if (hashEntries.length === 0 && blockEntries.length === 0) throw new Error("Pending-дельта не содержит изменений")
    assertUniquePaths(hashEntries.map(({ projectPath }) => projectPath), "pendingHashes")
    assertUniquePaths(blockEntries.map(({ projectPath }) => projectPath), "pendingBlocks")
    this.root.transactionSync(() => {
      this.assertNoPending()
      for (const entry of hashEntries) this.tables.pendingHashes.putSync(entry.projectPath, entry.value)
      for (const entry of blockEntries) this.tables.pendingBlocks.putSync(entry.projectPath, entry.value)
    })
    await this.flush()
  }

  pendingAlreadyApplied(): boolean {
    const hashes = decodePendingEntries(this.tables.pendingHashes, "hash")
    const blocks = decodePendingEntries(this.tables.pendingBlocks, "block")
    if (hashes.length === 0 && blocks.length === 0) return false
    return hashes.every((entry) => pendingMatches(entry, this.tables.hashes))
      && blocks.every((entry) => pendingMatches(entry, this.tables.blocks))
  }

  async applyPending(): Promise<void> {
    const hashes = decodePendingEntries(this.tables.pendingHashes, "hash")
    const blocks = decodePendingEntries(this.tables.pendingBlocks, "block")
    if (hashes.length === 0 && blocks.length === 0) throw new Error("Pending-дельта отсутствует")
    this.root.transactionSync(() => {
      applyPendingEntries(hashes, this.tables.hashes)
      applyPendingEntries(blocks, this.tables.blocks)
    })
    await this.flush()
  }

  async clearPending(): Promise<void> {
    this.root.transactionSync(() => {
      this.tables.pendingHashes.clearSync()
      this.tables.pendingBlocks.clearSync()
    })
    await this.flush()
  }

  async discard(): Promise<void> {
    this.assertCandidate()
    await this.close()
    if (this.relocated) return
    await Promise.all([
      rm(this.storeDescriptor.dataPath, { force: true }),
      rm(this.storeDescriptor.lockPath, { force: true }),
    ])
  }

  async flush(): Promise<void> {
    await this.root.flushed
  }

  close(): Promise<void> {
    if (this.closePromise === undefined) {
      this.readTransaction?.done()
      this.closePromise = this.root.close()
    }
    return this.closePromise
  }

  private readOptions(): { readonly transaction: Transaction } | undefined {
    return this.readTransaction === undefined ? undefined : { transaction: this.readTransaction }
  }

  assertCandidate(): void {
    if (!this.candidate) throw new Error("Операция разрешена только для временного снимка")
  }

  private assertNoPending(): void {
    if (this.tables.pendingHashes.getCount() !== 0 || this.tables.pendingBlocks.getCount() !== 0) {
      throw new Error("Операция невозможна: снимок содержит pending-дельту")
    }
  }
}

interface DecodedPendingEntry {
  readonly projectPath: string
  readonly kind: "put" | "delete"
  readonly value?: Uint8Array
}

function decodePendingEntries(
  table: Database<Uint8Array, string>,
  valueKind: "hash" | "block",
): readonly DecodedPendingEntry[] {
  return [...table.getRange()].map(({ key, value }) => {
    const projectPath = validateProjectPath(key)
    const decoded = decodePendingValue(value)
    if (decoded.kind === "delete") return { projectPath, kind: "delete" }
    if (valueKind === "hash") decodeContentHash(decoded.value)
    else decodeBlockV1(decoded.value)
    return { projectPath, kind: "put", value: decoded.value }
  })
}

function pendingMatches(entry: DecodedPendingEntry, active: Database<Uint8Array, string>): boolean {
  const value = active.get(entry.projectPath)
  if (entry.kind === "delete") return value === undefined
  return value !== undefined && Buffer.from(value).equals(Buffer.from(entry.value!))
}

function applyPendingEntries(
  entries: readonly DecodedPendingEntry[],
  active: Database<Uint8Array, string>,
): void {
  for (const entry of entries) {
    if (entry.kind === "delete") active.removeSync(entry.projectPath)
    else active.putSync(entry.projectPath, entry.value!)
  }
}

function mergeBlockEntities(
  existing: readonly ConfigurationIndexBlockEntity[],
  incoming: readonly ConfigurationIndexBlockEntity[],
): readonly ConfigurationIndexBlockEntity[] {
  const byAddress = new Map(existing.map((entity) => [entity.logicalAddress, copyEntity(entity)]))
  for (const entity of incoming) {
    const previous = byAddress.get(entity.logicalAddress)
    if (previous === undefined) {
      byAddress.set(entity.logicalAddress, copyEntity(entity))
      continue
    }
    byAddress.set(entity.logicalAddress, mergeEntity(previous, entity))
  }
  return [...byAddress.values()]
}

function mergeEntity(
  previous: ConfigurationIndexBlockEntity,
  incoming: ConfigurationIndexBlockEntity,
): ConfigurationIndexBlockEntity {
  for (const field of ["uuid", "xmlId", "children"] as const) {
    if (previous[field] !== undefined && incoming[field] !== undefined) {
      throw new Error(`Конфликт поля ${field} для ${incoming.logicalAddress}`)
    }
  }
  return {
    logicalAddress: previous.logicalAddress,
    uuid: incoming.uuid ?? previous.uuid,
    xmlId: incoming.xmlId ?? previous.xmlId,
    children: incoming.children ?? previous.children,
  }
}

function copyEntity(entity: ConfigurationIndexBlockEntity): ConfigurationIndexBlockEntity {
  return structuredClone(entity)
}

function asLmdbStore(store: ConfigurationIndexStore): LmdbConfigurationIndexStore {
  if (!(store instanceof LmdbConfigurationIndexStore)) throw new Error("Несовместимая реализация ConfigurationIndexStore")
  return store
}

function asCandidateStore(store: ConfigurationIndexCandidateStore): LmdbConfigurationIndexStore {
  const candidate = asLmdbStore(store)
  candidate.assertCandidate()
  return candidate
}

function assertUniquePaths(paths: readonly string[], tableName: string): void {
  if (new Set(paths).size !== paths.length) throw new Error(`Повтор project path в ${tableName}`)
}

function openTables(root: RootDatabase<Uint8Array, string>): ConfigurationIndexTables {
  return {
    meta: root.openDB<Uint8Array, string>({ name: "meta", encoding: "binary" }),
    hashes: root.openDB<Uint8Array, string>({ name: "hashes", encoding: "binary" }),
    blocks: root.openDB<Uint8Array, string>({ name: "blocks", encoding: "binary" }),
    pendingHashes: root.openDB<Uint8Array, string>({ name: "pendingHashes", encoding: "binary" }),
    pendingBlocks: root.openDB<Uint8Array, string>({ name: "pendingBlocks", encoding: "binary" }),
  }
}

function openRoot(
  descriptor: ConfigurationIndexStoreDescriptor,
  mode: "readOnly" | "readWrite",
): RootDatabase<Uint8Array, string> {
  return open<Uint8Array, string>({
    path: descriptor.dataPath,
    noSubdir: true,
    encoding: "binary",
    maxDbs: 8,
    readOnly: mode === "readOnly",
    overlappingSync: process.platform !== "win32",
  })
}

function initializeOrValidateSchema(
  root: RootDatabase<Uint8Array, string>,
  meta: Database<Uint8Array, string>,
  mode: "readOnly" | "readWrite",
): void {
  const encodedVersion = meta.get("schemaVersion")
  if (encodedVersion === undefined) {
    if (mode === "readOnly") throw new Error("В снимке отсутствует schemaVersion")
    const value = Buffer.alloc(4)
    value.writeUInt32LE(CONFIGURATION_INDEX_SCHEMA_VERSION)
    root.transactionSync(() => meta.putSync("schemaVersion", value))
    return
  }
  if (encodedVersion.byteLength !== 4) throw new Error("Некорректный schemaVersion")
  const actualVersion = Buffer.from(encodedVersion).readUInt32LE()
  if (actualVersion !== CONFIGURATION_INDEX_SCHEMA_VERSION) {
    throw new Error(`Неподдерживаемый schemaVersion: ${actualVersion}`)
  }
}

function validateDescriptor(descriptor: ConfigurationIndexStoreDescriptor): void {
  if (descriptor.schemaVersion !== CONFIGURATION_INDEX_SCHEMA_VERSION) {
    throw new Error(`Неподдерживаемая версия descriptor: ${descriptor.schemaVersion}`)
  }
  if (descriptor.lockPath !== `${descriptor.dataPath}-lock`) throw new Error("Некорректный путь lock-файла")
}

function errorMessage(error: unknown): string {
  return configurationIndexErrorMessage(error)
}
